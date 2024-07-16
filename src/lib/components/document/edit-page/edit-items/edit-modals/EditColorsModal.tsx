import ModalWrapper from '../../../../modal/Modal'
import EditColors from '../edit-tools/EditColors'

interface IEditColorsModalParams {
  visible: boolean
  setVisible: (visible: boolean) => void
}

const EditColorsModal = ({ visible, setVisible }: IEditColorsModalParams) => {
  return (
    <ModalWrapper isOpen={visible} onClose={() => setVisible(false)} title="">
      <div className="efw-flex efw-justify-center efw-items-center efw-pl-4">
        <EditColors />
      </div>
    </ModalWrapper>
  )
}

export default EditColorsModal
