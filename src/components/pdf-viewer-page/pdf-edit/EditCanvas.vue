<script setup lang="ts">
import { EDIT_TOOL, LAYER_STATE } from '@/assets/utils/enums';
import { resizeElements } from '@/assets/utils/functions';
import { useDocumentStore, useViewerStore } from '@/stores';
import type { ILayer } from '@/assets/utils/interfaces';
import { onMounted, onUnmounted, ref, watch } from 'vue';

const docStore = useDocumentStore();
const viewerStore = useViewerStore();

const svgRef = ref<SVGElement | null>(null);
const isDrawing = ref<boolean>(false);
const entity = ref<SVGLineElement | SVGRectElement | SVGPathElement | null>(
  null
);
const lastRectCords = ref<{ x: number; y: number }>({
  x: 0,
  y: 0,
});
const recreatElement = ref<boolean>(true);
const path = ref<string>('M');
const layerCache = ref<Map<string, ILayer | null>>(new Map());
const currentLoadingPage = ref<number | null>(null);
const currentPageForSvg = ref<number | null>(null);
const savingPages = ref<Map<number, boolean>>(new Map()); // Track which pages are saving
const pendingSaves = ref<Map<number, { svgContent: string; timestamp: number }>>(new Map()); // Track pending saves with content
const pageLayerMap = ref<Map<number, ILayer | null>>(new Map());
const saveQueue = ref<Map<number, Promise<void>>>(new Map()); // Track ongoing save promises
const autoSaveTimeouts = ref<Map<number, number>>(new Map()); // Debounce timeouts for auto-save

const debouncedAutoSave = (immediate: boolean = false) => {
  if (!svgRef.value || !docStore.groupId || currentPageForSvg.value === null) return;
  
  const pageToSave = currentPageForSvg.value;
  
  // Clear existing timeout for this page
  const existingTimeout = autoSaveTimeouts.value.get(pageToSave);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }
  
  if (immediate) {
    autoSave();
  } else {
    // Debounce the save by 300ms
    const timeout = setTimeout(() => {
      autoSave();
      autoSaveTimeouts.value.delete(pageToSave);
    }, 300);
    
    autoSaveTimeouts.value.set(pageToSave, timeout);
  }
};

const autoSave = async () => {
  if (!svgRef.value || !docStore.groupId || currentPageForSvg.value === null) return;
  
  const pageToSave = currentPageForSvg.value;
  const svgContent = svgRef.value.outerHTML;
  const timestamp = Date.now();
  
  // IMMEDIATELY update local cache with the latest content
  await updateCacheForPage(pageToSave, svgContent);
  
  // If there's already a save in progress for this page, queue this content for later
  if (saveQueue.value.has(pageToSave)) {
    pendingSaves.value.set(pageToSave, { svgContent, timestamp });
    return;
  }
  
  // Start the save process
  const savePromise = performSave(pageToSave, svgContent, timestamp);
  saveQueue.value.set(pageToSave, savePromise);
  
  try {
    await savePromise;
  } finally {
    saveQueue.value.delete(pageToSave);
    
    // Check if there's a pending save with newer content
    const pendingSave = pendingSaves.value.get(pageToSave);
    if (pendingSave) {
      pendingSaves.value.delete(pageToSave);
      // Recursively save the newer content
      const recursivePromise = performSave(pageToSave, pendingSave.svgContent, pendingSave.timestamp);
      saveQueue.value.set(pageToSave, recursivePromise);
      await recursivePromise;
      saveQueue.value.delete(pageToSave);
    }
  }
};

const updateCacheForPage = async (pageNum: number, svgContent: string) => {
  if (!docStore.groupId) return;
  
  const cacheKey = `${docStore.groupId}-${pageNum}`;
  const existingLayer = pageLayerMap.value.get(pageNum);
  
  if (existingLayer) {
    const updatedLayer = { ...existingLayer, svg: svgContent };
    layerCache.value.set(cacheKey, updatedLayer);
    pageLayerMap.value.set(pageNum, updatedLayer);
    
    // Update the store if this is the currently active page
    if (currentPageForSvg.value === pageNum) {
      docStore.setLayer(updatedLayer);
    }
  } else {
    const tempLayer = { id: `temp-${pageNum}`, svg: svgContent };
    layerCache.value.set(cacheKey, tempLayer);
    pageLayerMap.value.set(pageNum, tempLayer);
    
    // Update the store if this is the currently active page
    if (currentPageForSvg.value === pageNum) {
      docStore.setLayer(tempLayer);
    }
  }
};

const performSave = async (pageNum: number, svgContent: string, timestamp: number) => {
  if (!docStore.groupId) return;
  
  const cacheKey = `${docStore.groupId}-${pageNum}`;
  const layerToSave = pageLayerMap.value.get(pageNum);
  
  // Set saving state only if this is the current page
  if (currentPageForSvg.value === pageNum) {
    docStore.setLayerState(LAYER_STATE.SAVING);
  }
  
  try {
    let resultLayer: ILayer | null = null;
    
    if (layerToSave && layerToSave.id && !layerToSave.id.startsWith('temp-')) {
      // Update existing layer
      await viewerStore.editPackage!.updateLayerFunc(
        layerToSave.id,
        svgContent,
        docStore.groupId,
        pageNum
      );
      resultLayer = { ...layerToSave, svg: svgContent };
    } else {
      // Create new layer
      resultLayer = await viewerStore.editPackage!.saveLayerFunc(
        svgContent,
        docStore.groupId,
        pageNum
      );
    }
    
    // Update cache with the final result only if this save is still relevant
    if (resultLayer) {
      // Check if we have a newer pending save
      const pendingSave = pendingSaves.value.get(pageNum);
      if (!pendingSave || pendingSave.timestamp <= timestamp) {
        layerCache.value.set(cacheKey, resultLayer);
        pageLayerMap.value.set(pageNum, resultLayer);
        
        // Update the store if this is still the current page
        if (currentPageForSvg.value === pageNum) {
          docStore.setLayer(resultLayer);
        }
      }
    }
  } catch (error) {
    console.error(`Failed to save layer for page ${pageNum}:`, error);
    // On error, keep the cache as is - user's work is still preserved locally
  } finally {
    // Only update layer state if this is still the current page
    if (currentPageForSvg.value === pageNum) {
      docStore.setLayerState(LAYER_STATE.READY);
    }
  }
};

// Function for starting the drawing
const startDrawing = ({ clientX, clientY }: MouseEvent) => {
  if (
    docStore.editTool === EDIT_TOOL.MOUSE ||
    docStore.layerState === LAYER_STATE.NOT_READY ||
    docStore.layerState === LAYER_STATE.LOADING
  )
    return;
    
  if (docStore.editTool === EDIT_TOOL.ERASER) {
    isDrawing.value = true;
    return;
  }

  // Get SVG's bounding box
  const svgRect = svgRef.value!.getBoundingClientRect();

  // Calculate mouse position relative to the SVG
  const x = clientX - svgRect.left;
  const y = clientY - svgRect.top;

  if (docStore.editTool === EDIT_TOOL.LINE) {
    entity.value?.setAttribute('x1', x.toString());
    entity.value?.setAttribute('y1', y.toString());
    entity.value?.setAttribute('x2', x.toString());
    entity.value?.setAttribute('y2', y.toString());
  } else if ([EDIT_TOOL.RECT, EDIT_TOOL.CIRCLE].includes(docStore.editTool)) {
    entity.value?.setAttribute(
      'rx',
      docStore.editTool === EDIT_TOOL.CIRCLE ? '50%' : '0'
    ); // radius
    lastRectCords.value = { x, y };
  } else {
    path.value = path.value + `${x},${y} `;
  }
  svgRef.value?.append(entity.value as any);
  isDrawing.value = true;
};

const draw = ({ clientX, clientY }: MouseEvent) => {
  if (!isDrawing.value || docStore.editTool === EDIT_TOOL.ERASER) return;

  // Get SVG's bounding box
  const svgRect = svgRef.value!.getBoundingClientRect();

  // Calculate mouse position relative to the SVG
  const x = clientX - svgRect.left;
  const y = clientY - svgRect.top;

  if (docStore.editTool === EDIT_TOOL.LINE) {
    entity.value?.setAttribute('x2', x.toString());
    entity.value?.setAttribute('y2', y.toString());
  } else if ([EDIT_TOOL.RECT, EDIT_TOOL.CIRCLE].includes(docStore.editTool)) {
    const width = Math.abs(x - lastRectCords.value.x);
    const height = Math.abs(y - lastRectCords.value.y);
    const rx = x < lastRectCords.value.x ? x : lastRectCords.value.x;
    const ry = y < lastRectCords.value.y ? y : lastRectCords.value.y;

    entity.value?.setAttribute('x', rx.toString());
    entity.value?.setAttribute('y', ry.toString());
    entity.value?.setAttribute('width', width.toString());
    entity.value?.setAttribute('height', height.toString());
  } else {
    path.value = path.value + `L${x},${y} `;
    entity.value?.setAttribute('d', path.value);
  }
  
  // Use debounced save during drawing for better performance
  debouncedAutoSave();
};

// Function for ending the drawing
const endDrawing = async () => {
  if (!isDrawing.value) return;
  
  const pageNum = currentPageForSvg.value;
  if (pageNum === null || !docStore.groupId || !svgRef.value) return;
  
  isDrawing.value = false;
  
  if (docStore.editTool === EDIT_TOOL.ERASER) {
    // For eraser, save immediately as content has changed
    debouncedAutoSave(true);
    return;
  }

  // Clean up drawing state
  entity.value = null;
  path.value = 'M';
  recreatElement.value = !recreatElement.value;
  
  // Save the drawing immediately when drawing ends
  debouncedAutoSave(true);
};

const handleMouseOver = (event: Event) => {
  // Get target
  const target = event.target as SVGElement;
  if (
    EDIT_TOOL.ERASER === docStore.editTool &&
    isDrawing.value &&
    target.parentNode === svgRef.value
  ) {
    // Remove from svg
    svgRef.value?.removeChild(target);
    // Use debounced save during erasing for better performance
    debouncedAutoSave();
  }
};

// Initialization when something change
watch(
  () => [
    docStore.editTool,
    recreatElement.value,
    docStore.toolColor,
    docStore.toolSize,
  ],
  () => {
    if (EDIT_TOOL.ERASER !== docStore.editTool) {
      const newEntity = document.createElementNS(
        'http://www.w3.org/2000/svg',
        docStore.editTool === EDIT_TOOL.LINE
          ? 'line'
          : [EDIT_TOOL.CIRCLE, EDIT_TOOL.RECT].includes(docStore.editTool)
          ? 'rect'
          : 'path'
      );

      // set atributes to make it smooth and to our desires when it comes to width and color
      newEntity.setAttribute(
        'opacity',
        docStore.editTool === EDIT_TOOL.HIGHLIGHTER ? '0.3' : '1'
      );
      // Set the size we've chosen
      newEntity.setAttribute('stroke-width', docStore.toolSize.toString());
      newEntity.setAttribute('stroke-linecap', 'round');
      newEntity.setAttribute('stroke-linejoin', 'round');
      newEntity.setAttribute('stroke-dasharray', '0,1');
      newEntity.setAttribute('fill', 'none');
      // set color we've chosen
      newEntity.setAttribute('stroke', docStore.toolColor);
      entity.value = newEntity;
    }
  }
);

onMounted(async () => {
  // Get groups
  const groups = await viewerStore.editPackage!.getGroupsFunc();

  // If there is no group create one
  if (groups.length === 0) {
    const { response } = await viewerStore.editPackage!.saveGroupFunc(
      'edit-group'
    );
    docStore.setGroupId(response.id);
  } else {
    // else assigne existing one
    docStore.setGroupId(groups[0].id);
  }
});

onUnmounted(async () => {
  // Clear all pending timeouts
  for (const timeout of autoSaveTimeouts.value.values()) {
    clearTimeout(timeout);
  }
  autoSaveTimeouts.value.clear();
  
  // Save any pending changes before unmounting
  if (currentPageForSvg.value !== null && svgRef.value && svgRef.value.children.length > 0) {
    await updateCacheForPage(currentPageForSvg.value, svgRef.value.outerHTML);
  }
  
  // Wait for any ongoing saves to complete
  const allSavePromises = Array.from(saveQueue.value.values());
  if (allSavePromises.length > 0) {
    try {
      await Promise.all(allSavePromises);
    } catch (error) {
      console.error('Some saves failed during cleanup:', error);
    }
  }
});

watch(
  () => [docStore.activePage, svgRef.value, docStore.groupId],
  async () => {
    if (!docStore.groupId) return;
    
    const pageToLoad = docStore.activePage;
    
    // If we're already loading this page, don't start another load
    if (currentLoadingPage.value === pageToLoad && currentPageForSvg.value === pageToLoad) {
      return;
    }
    
    currentLoadingPage.value = pageToLoad;
    
    // Save current page content before switching if there's unsaved work
    if (currentPageForSvg.value !== null && 
        currentPageForSvg.value !== pageToLoad && 
        svgRef.value && 
        svgRef.value.children.length > 0) {
      await updateCacheForPage(currentPageForSvg.value, svgRef.value.outerHTML);
    }
    
    // Clear the SVG and update current page reference
    svgRef.value?.replaceChildren();
    docStore.setLayer(null);
    currentPageForSvg.value = pageToLoad;

    const cacheKey = `${docStore.groupId}-${pageToLoad}`;
    const cachedLayer = layerCache.value.get(cacheKey);
    
    // Load from cache if available
    if (cachedLayer !== undefined) {
      await loadLayerIntoSvg(cachedLayer, pageToLoad);
      docStore.setLayerState(LAYER_STATE.READY);
      return;
    }

    // Load from server
    docStore.setLayerState(LAYER_STATE.LOADING);
    
    try {
      const layer = await viewerStore.editPackage!.getLayerFunc(
        pageToLoad,
        docStore.groupId
      );
      
      // Check if we're still loading the same page (user might have switched again)
      if (currentLoadingPage.value !== pageToLoad) {
        return;
      }

      // Cache the loaded layer
      layerCache.value.set(cacheKey, layer);
      
      // Load into SVG
      await loadLayerIntoSvg(layer, pageToLoad);
      
    } catch (error) {
      console.error(`Failed to load layer for page ${pageToLoad}:`, error);
      // Set empty layer on error
      layerCache.value.set(cacheKey, null);
      pageLayerMap.value.set(pageToLoad, null);
    } finally {
      // Only update state if we're still on the same page
      if (currentLoadingPage.value === pageToLoad && currentPageForSvg.value === pageToLoad) {
        docStore.setLayerState(LAYER_STATE.READY);
      }
    }
  }
);

const loadLayerIntoSvg = async (layer: ILayer | null, pageNum: number) => {
  if (!svgRef.value) return;
  
  if (layer) {
    const layerClone = { ...layer };
    pageLayerMap.value.set(pageNum, layerClone);
    docStore.setLayer(layerClone);
    
    try {
      // Parse SVG string into a DOM object
      const parser = new DOMParser();
      const doc = parser.parseFromString(layer.svg, 'image/svg+xml');
      const parsedSvg = doc.documentElement;

      // Get width and height from parsed SVG
      const width = parseFloat(parsedSvg.getAttribute('width') || '0');
      const height = parseFloat(parsedSvg.getAttribute('height') || '0');

      // Clear existing content and append new child nodes
      svgRef.value.replaceChildren();
      if (parsedSvg && parsedSvg.children.length > 0) {
        Array.from(parsedSvg.children).forEach((child) => {
          svgRef.value!.appendChild(child.cloneNode(true));
        });

        // Resize to current dimensions if we have valid dimensions
        if (width > 0 && height > 0) {
          resizeElements(
            svgRef.value.children,
            docStore.canvasWidth,
            docStore.canvasHeight,
            width,
            height
          );
        }
      }
    } catch (error) {
      console.error(`Failed to parse SVG for page ${pageNum}:`, error);
      // Clear the SVG on parse error
      svgRef.value.replaceChildren();
    }
  } else {
    // No layer for this page
    pageLayerMap.value.set(pageNum, null);
    docStore.setLayer(null);
    svgRef.value.replaceChildren();
  }
};

// Watch for size change
watch(
  () => [docStore.canvasWidth, docStore.canvasHeight],
  ([width, height], [oldWidth, oldHeight]) => {
    resizeElements(svgRef.value!.children, width, height, oldWidth, oldHeight);
  }
);
</script>

<template>
  <svg
    id="pdf-viewer-edit-canvas"
    :xmlns="'http://www.w3.org/2000/svg'"
    class="absolute top-0 left-0 w-full h-full z-10"
    :class="
      docStore.editTool === EDIT_TOOL.MOUSE
        ? 'cursor-default'
        : 'cursor-crosshair'
    "
    v-bind="$attrs"
    ref="svgRef"
    :width="docStore.canvasWidth"
    :height="docStore.canvasHeight"
    @mousedown="startDrawing"
    @mouseup="endDrawing"
    @mousemove="draw"
    @mouseleave="endDrawing"
    @mouseover="handleMouseOver"
  ></svg>
</template>
