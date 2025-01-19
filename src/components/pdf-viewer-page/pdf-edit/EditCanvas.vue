<script setup lang="ts">
import { EDIT_TOOL, LAYER_STATE } from '@/assets/utils/enums';
import { resizeElements } from '@/assets/utils/functions';
import { useDocumentStore, useViewerStore } from '@/stores';
import { onMounted, ref, watch } from 'vue';

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

const autoSave = async () => {
  if (!svgRef.value || !docStore.groupId) return;
  docStore.setLayerState(LAYER_STATE.SAVING);

  // If layer exist, update
  if (docStore.layer) {
    await viewerStore.editPackage!.updateLayerFunc(
      docStore.layer.id,
      svgRef.value.outerHTML,
      docStore.groupId,
      docStore.activePage
    );
  }
  // Save
  else {
    // Save layer
    const layer = await viewerStore.editPackage!.saveLayerFunc(
      svgRef.value.outerHTML,
      docStore.groupId,
      docStore.activePage
    );

    docStore.setLayer(layer);
  }
  docStore.setLayerState(LAYER_STATE.DONE);
};

// Function for starting the drawing
const startDrawing = ({ clientX, clientY }: MouseEvent) => {
  if (
    docStore.editTool === EDIT_TOOL.MOUSE ||
    docStore.layerState !== LAYER_STATE.DONE
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
};

// Function for ending the drawing
const endDrawing = async () => {
  if (!isDrawing.value) return;
  if (docStore.editTool === EDIT_TOOL.ERASER) {
    isDrawing.value = false;
    await autoSave();
    return;
  }

  entity.value = null;
  isDrawing.value = false;
  path.value = 'M';
  recreatElement.value = !recreatElement.value; // for trigger createing new entity
  await autoSave();
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

watch(
  () => [docStore.activePage, svgRef.value, docStore.groupId],
  async () => {
    if (!docStore.groupId) return;
    // Reset svg
    svgRef.value?.replaceChildren();
    docStore.setLayer(null);

    // Set layer loading
    docStore.setLayerState(LAYER_STATE.LOADING);
    // Get layer if there is any for active page
    const layer = await viewerStore.editPackage!.getLayerFunc(
      docStore.activePage,
      docStore.groupId
    );

    if (layer && svgRef.value) {
      docStore.setLayer(layer);
      // Parse SVG string into a DOM object
      const parser = new DOMParser();
      const doc = parser.parseFromString(layer.svg, 'image/svg+xml');
      const parsedSvg = doc.documentElement;

      // Get width and height from parsed SVG
      const width = parseFloat(parsedSvg.getAttribute('width')!);
      const height = parseFloat(parsedSvg.getAttribute('height')!);

      // Append child nodes to the SVG element
      if (parsedSvg) {
        Array.from(parsedSvg.children).forEach((child) => {
          svgRef.value!.appendChild(child);
        });

        // Resize to current width and height
        resizeElements(
          svgRef.value.children,
          docStore.canvasWidth,
          docStore.canvasHeight,
          width,
          height
        );
      }
    }
    // DONE
    docStore.setLayerState(LAYER_STATE.DONE);
  }
);

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
