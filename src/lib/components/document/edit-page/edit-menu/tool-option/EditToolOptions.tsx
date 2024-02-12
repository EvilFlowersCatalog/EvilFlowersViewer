import { EDIT_TOOLS } from '../../../../../../utils/enums'
import { useDocumentContext } from '../../../DocumentContext'
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
    <div className="eidt-tool-option-container">
      {activeEditTool !== EDIT_TOOLS.MOUSE &&
        activeEditTool !== EDIT_TOOLS.ERASER && (
          <div
            style={{
              display: 'flex',
              gap: '16px',
              flexDirection: 'column',
              marginLeft: '20px',
            }}
          >
            <div className="edit-tool-option-box">
              <span className="edit-tool-option-text">{t('editWidth')}</span>
              <Slider
                value={editLineSize}
                max={30}
                min={2}
                valueLabelDisplay="auto"
                onChange={(_, value) => setEditLineSize(value as number)}
              />
            </div>

            <div className="edit-tool-option-box">
              <span className="edit-tool-option-text">{t('editOpacity')}</span>
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
