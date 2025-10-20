import { toast } from 'react-toastify';
import ConfirmToast from '../components/ConfirmationToast';

export const showConfirmationToast = ({ message, onConfirm }) => {
  toast(
    ({ closeToast }) => (
      <ConfirmToast
        message={message}
        onConfirm={() => {
          closeToast();
          onConfirm();
        }}
        onCancel={() => {
          closeToast();
        }}
      />
    ),
    {
      autoClose: false,
      closeOnClick: false,
      closeButton: false,
      position: 'top-center',
    }
  );
};