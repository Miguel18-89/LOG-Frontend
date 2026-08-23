import { useEffect, useRef, useState } from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Typography from '@mui/joy/Typography';

/**
 * Área de assinatura em <canvas>. Funciona com rato e com toque (Pointer Events),
 * e devolve a assinatura como PNG em data URI através de onConfirm.
 */
export default function SignaturePad({ onConfirm, onCancel, height = 200 }) {
    const canvasRef = useRef(null);
    const drawingRef = useRef(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    // O canvas é desenhado à resolução do ecrã para a assinatura não sair pixelizada.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ratio = window.devicePixelRatio || 1;
        const width = canvas.parentElement.clientWidth;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext('2d');
        ctx.scale(ratio, ratio);
        // Fundo branco explícito: sem isto o PNG sai com fundo transparente e
        // fica invisível sobre o fundo branco do PDF.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#1a1a1a';
    }, [height]);

    function pointFromEvent(e) {
        const rect = canvasRef.current.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function handlePointerDown(e) {
        e.preventDefault();
        canvasRef.current.setPointerCapture(e.pointerId);
        const ctx = canvasRef.current.getContext('2d');
        const { x, y } = pointFromEvent(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        drawingRef.current = true;
        setHasDrawn(true);
    }

    function handlePointerMove(e) {
        if (!drawingRef.current) return;
        e.preventDefault();
        const ctx = canvasRef.current.getContext('2d');
        const { x, y } = pointFromEvent(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    function handlePointerUp(e) {
        if (!drawingRef.current) return;
        drawingRef.current = false;
        try { canvasRef.current.releasePointerCapture(e.pointerId); } catch { /* já libertado */ }
    }

    function handleClear() {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const ratio = window.devicePixelRatio || 1;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width / ratio, canvas.height / ratio);
        setHasDrawn(false);
    }

    function handleConfirm() {
        onConfirm(canvasRef.current.toDataURL('image/png'));
    }

    return (
        <Box>
            <Typography level="body-xs" sx={{ color: '#888', mb: 0.5 }}>
                Assine na área abaixo com o dedo ou com o rato.
            </Typography>
            <Box
                sx={{
                    border: '1px dashed #bbb',
                    borderRadius: 'sm',
                    overflow: 'hidden',
                    bgcolor: '#fff',
                    lineHeight: 0,
                }}
            >
                <canvas
                    ref={canvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    // Sem isto o browser interpreta o arrasto como scroll da página.
                    style={{ touchAction: 'none', cursor: 'crosshair', display: 'block' }}
                />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5, justifyContent: 'flex-end' }}>
                {onCancel && (
                    <Button variant="plain" color="neutral" size="sm" onClick={onCancel}>
                        Cancelar
                    </Button>
                )}
                <Button variant="outlined" color="neutral" size="sm" onClick={handleClear} disabled={!hasDrawn}>
                    Limpar
                </Button>
                <Button color="warning" size="sm" onClick={handleConfirm} disabled={!hasDrawn}>
                    Confirmar assinatura
                </Button>
            </Box>
        </Box>
    );
}
