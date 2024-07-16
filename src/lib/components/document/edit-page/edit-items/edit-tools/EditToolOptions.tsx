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
    <div className="flex flex-col justify-evenly h-[130px]">
      {activeEditTool !== EDIT_TOOLS.MOUSE &&
        activeEditTool !== EDIT_TOOLS.ERASER && (
          <div className="flex gap-4 flex-col ml-5">
            <div className="w-[100px] flex flex-col items-center">
              <span className="text-sm">{t('editWidth')}</span>
              <Slider
                value={editLineSize}
                max={30}
                min={2}
                valueLabelDisplay="auto"
                onChange={(_, value) => setEditLineSize(value as number)}
              />
            </div>

            <div className="w-full flex flex-col items-center">
              <span className="text-sm">{t('editOpacity')}</span>
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
