import Button from '@mui/joy/Button';

export default function ConfirmToast({ message, onConfirm, onCancel }) {
  return (
    <div>
      <p>{message}</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <Button color="danger" size="sm" onClick={onConfirm}>
          Sim
        </Button>
        <Button variant="outlined" size="sm" onClick={onCancel}>
          Não
        </Button>
      </div>
    </div>
  );
}