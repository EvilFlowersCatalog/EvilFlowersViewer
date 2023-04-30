import { ReactNode } from 'react';
import { useDocumentContext } from '../document/DocumentContext';


/**
 * ModalWrapper
 * @param label - Label of the caller button
 * @param isOpen - Is the modal open?
 * @param onClose - Function to close the modal
 * @param children - Children of the modal
 * @constructor
 * @returns {JSX.Element}
 * 
 */
type Props = {
  label: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

/**
 * 
 * @param label - Label of the caller button
 * @param isOpen - Is the modal open?
 * @param onClose - Function to close the modal
 * @param children - Children of the modal
 *  
 * @returns Modal window based on the label from props
 */
const ModalWrapper = ({ label, isOpen, onClose, children }: Props) => {
  const { downloadDocument } = useDocumentContext()
  return (
    <>
      {isOpen && (
        <div className="fixed z-20 inset-0 overflow-none">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity bg-black dark:bg-grey opacity-80">
            </div>
            <div className="relative z-30 opacity-100 inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-lg rounded-lg">
              <div className="absolute top-0 right-0 pt-4 pr-4">
              </div>
              <div className="mt-2">{children}</div>
              <div className="mt-4 flex justify-end">
                <button
                  className="inline-flex justify-center py-2 px-4 border-none shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                  {... (label === 'Download' && {onClick: () => {downloadDocument()}})}
                  //console.log(label + ' clicked')
                  // TODO: Add functionality
                >
                  {label}
                </button>
                <button
                  className="inline-flex justify-center py-2 px-4 bg-transparent border-none hover:bg-gray-50 dark:hover:bg-gray-900 rounded text-gray-500 dark:text-gray-300 text-center duration-200"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalWrapper;
