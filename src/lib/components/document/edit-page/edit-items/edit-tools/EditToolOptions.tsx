import { EDIT_TOOLS } from '../../../../../../utils/enums'
import { useDocumentContext } from '../../../../hooks/useDocumentContext'
import Slider from '@mui/material/Slider'
import { useTranslation } from 'react-i18next'

const EditToolOption = () => {
  const {
    activeEditTool,
    setEditLineSize,
    setEditOpacity,
    editOpacity,
    editLineSize,
  } = useDocumentContext()
  const { t } = useTranslation()

  return (
    <div className="efw-flex efw-flex-col efw-justify-evenly efw-h-[130px]">
      {activeEditTool !== EDIT_TOOLS.MOUSE &&
        activeEditTool !== EDIT_TOOLS.ERASER && (
          <div className="efw-flex efw-gap-4 efw-flex-col efw-ml-5">
            <div className="efw-w-[100px] efw-flex efw-flex-col efw-items-center">
              <span className="efw-text-sm">{t('editWidth')}</span>
              <Slider
                value={editLineSize}
                max={30}
                min={2}
                valueLabelDisplay="auto"
                onChange={(_, value) => setEditLineSize(value as number)}
              />
            </div>

            <div className="efw-w-full efw-flex efw-flex-col efw-items-center">
              <span className="efw-text-sm">{t('editOpacity')}</span>
              <Slider
                value={editOpacity}
                step={0.1}
                max={1}
                min={0.1}
                valueLabelDisplay="auto"
                onChange={(_, value) => setEditOpacity(value as number)}
              />
            </div>
          </div>
        )}
    </div>
  )
}

export default EditToolOption
