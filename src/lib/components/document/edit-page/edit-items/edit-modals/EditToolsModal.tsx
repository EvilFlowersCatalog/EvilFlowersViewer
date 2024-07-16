import ModalWrapper from '../../../../modal/Modal'
import EditToolOption from '../edit-tools/EditToolOptions'
import EditTools from '../edit-tools/EditTools'

interface IEditToolsModalParams {
  visible: boolean
  setVisible: (visible: boolean) => void
}

const EditToolsModal = ({ visible, setVisible }: IEditToolsModalParams) => {
  return (
    <ModalWrapper isOpen={visible} onClose={() => setVisible(false)} title="">
      <div className="efw-flex efw-flex-col efw-justify-center efw-items-center efw-gap-4">
        <EditTools />
        <EditToolOption />
      </div>
    </ModalWrapper>
  )
}

export default EditToolsModal
