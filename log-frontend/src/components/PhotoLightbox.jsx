import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/joy/Box';
import Modal from '@mui/joy/Modal';
import IconButton from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import CircularProgress from '@mui/joy/CircularProgress';
import { MdClose, MdChevronLeft, MdChevronRight } from 'react-icons/md';

const MAX_SCALE = 5;
const DOUBLE_CLICK_SCALE = 2.5;
const STEP = 1.2;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Visualizador de fotos em ecrã inteiro, com navegação entre elas e ampliação.
 *
 * As fotos exigem token, por isso não se pode apontar o URL diretamente ao
 * <img>: quem chama já as descarregou para as miniaturas e passa aqui esses
 * object URLs em `urls`, evitando descarregar a mesma imagem duas vezes.
 *
 * É um Modal do próprio Joy para que o Esc feche esta janela e não a ficha da
 * obra que fica por baixo — o empilhamento é o MUI que o trata.
 */
export default function PhotoLightbox({ photos, urls, index, onIndex, onClose }) {
    const boxRef = useRef(null);
    const drag = useRef(null);
    const [view, setView] = useState({ scale: 1, x: 0, y: 0 });

    const photo = photos[index];
    const url = photo ? urls[photo.id] : null;

    const go = useCallback((delta) => {
        if (photos.length < 2) return;
        // Dá a volta no fim da lista, em vez de parar na última foto.
        onIndex((index + delta + photos.length) % photos.length);
    }, [index, photos.length, onIndex]);

    // Mudar de foto repõe a ampliação da anterior.
    useEffect(() => { setView({ scale: 1, x: 0, y: 0 }); }, [index]);

    useEffect(() => {
        function onKey(e) {
            if (e.key === 'ArrowRight') go(1);
            else if (e.key === 'ArrowLeft') go(-1);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [go]);

    /** Distância do rato ao centro da caixa, que é a referência da transformação. */
    const offsetFromCenter = useCallback((e) => {
        const rect = boxRef.current?.getBoundingClientRect();
        if (!rect) return { dx: 0, dy: 0 };
        return {
            dx: e.clientX - (rect.left + rect.width / 2),
            dy: e.clientY - (rect.top + rect.height / 2),
        };
    }, []);

    /**
     * Amplia mantendo debaixo do cursor o ponto apontado.
     *
     * Com a imagem desenhada como `translate(x,y) scale(s)`, o ponto que aparece
     * a `dx` do centro vem de `(dx - x) / s`; para continuar em `dx` depois de
     * mudar a escala basta `x' = dx - (dx - x) * (s' / s)`.
     */
    const zoomTo = useCallback((nextScale, dx, dy) => {
        const rect = boxRef.current?.getBoundingClientRect();
        if (!rect) return;
        setView(v => {
            const s = clamp(nextScale, 1, MAX_SCALE);
            const k = s / v.scale;
            const limX = (rect.width * (s - 1)) / 2;
            const limY = (rect.height * (s - 1)) / 2;
            return {
                scale: s,
                x: clamp(dx - (dx - v.x) * k, -limX, limX),
                y: clamp(dy - (dy - v.y) * k, -limY, limY),
            };
        });
    }, []);

    // A roda tem de ser ouvida à mão: o React regista este evento como passivo, e
    // aí o preventDefault não trava o deslocamento da página por baixo.
    useEffect(() => {
        const el = boxRef.current;
        if (!el) return;
        function onWheel(e) {
            e.preventDefault();
            const { dx, dy } = offsetFromCenter(e);
            setView(v => {
                const s = clamp(v.scale * (e.deltaY < 0 ? STEP : 1 / STEP), 1, MAX_SCALE);
                const k = s / v.scale;
                const rect = el.getBoundingClientRect();
                const limX = (rect.width * (s - 1)) / 2;
                const limY = (rect.height * (s - 1)) / 2;
                return {
                    scale: s,
                    x: clamp(dx - (dx - v.x) * k, -limX, limX),
                    y: clamp(dy - (dy - v.y) * k, -limY, limY),
                };
            });
        }
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [offsetFromCenter]);

    function handlePointerDown(e) {
        if (view.scale <= 1) return;
        drag.current = { x: e.clientX, y: e.clientY, ox: view.x, oy: view.y };
        e.currentTarget.setPointerCapture?.(e.pointerId);
    }

    function handlePointerMove(e) {
        const d = drag.current;
        if (!d) return;
        const rect = boxRef.current.getBoundingClientRect();
        const limX = (rect.width * (view.scale - 1)) / 2;
        const limY = (rect.height * (view.scale - 1)) / 2;
        setView(v => ({
            ...v,
            x: clamp(d.ox + e.clientX - d.x, -limX, limX),
            y: clamp(d.oy + e.clientY - d.y, -limY, limY),
        }));
    }

    function handlePointerUp() {
        drag.current = null;
    }

    function handleDoubleClick(e) {
        const { dx, dy } = offsetFromCenter(e);
        zoomTo(view.scale > 1.01 ? 1 : DOUBLE_CLICK_SCALE, dx, dy);
    }

    // Clicar ao lado da imagem fecha; clicar na própria imagem não, para não
    // fechar sem querer a meio de a percorrer.
    function handleClick(e) {
        if (e.target === e.currentTarget) onClose();
    }

    return (
        <Modal open onClose={onClose}>
            <Box
                sx={{
                    position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.94)',
                    display: 'flex', flexDirection: 'column', outline: 'none',
                }}
            >
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, flexShrink: 0,
                }}>
                    <Typography level="body-sm" sx={{ color: '#fff', flex: 1 }} noWrap>
                        {photo?.originalName ?? ''}
                    </Typography>
                    {photos.length > 1 && (
                        <Typography level="body-sm" sx={{ color: '#bbb' }}>
                            {index + 1} / {photos.length}
                        </Typography>
                    )}
                    <IconButton variant="plain" onClick={onClose} sx={{ color: '#fff' }} title="Fechar (Esc)">
                        <MdClose size={24} />
                    </IconButton>
                </Box>

                <Box
                    ref={boxRef}
                    onClick={handleClick}
                    onDoubleClick={handleDoubleClick}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    sx={{
                        flex: 1, position: 'relative', overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: view.scale > 1 ? 'grab' : 'zoom-in',
                        touchAction: 'none',
                    }}
                >
                    {url ? (
                        <Box
                            component="img"
                            src={url}
                            alt={photo?.originalName ?? ''}
                            draggable={false}
                            sx={{
                                maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                                transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                                userSelect: 'none',
                            }}
                        />
                    ) : (
                        <CircularProgress />
                    )}

                    {photos.length > 1 && (
                        <>
                            <IconButton
                                variant="solid" color="neutral" title="Anterior (seta esquerda)"
                                onClick={(e) => { e.stopPropagation(); go(-1); }}
                                sx={{ position: 'absolute', left: 12, opacity: 0.75 }}
                            >
                                <MdChevronLeft size={28} />
                            </IconButton>
                            <IconButton
                                variant="solid" color="neutral" title="Seguinte (seta direita)"
                                onClick={(e) => { e.stopPropagation(); go(1); }}
                                sx={{ position: 'absolute', right: 12, opacity: 0.75 }}
                            >
                                <MdChevronRight size={28} />
                            </IconButton>
                        </>
                    )}
                </Box>

                <Box sx={{ flexShrink: 0, pb: 1.5, px: 2 }}>
                    {photo?.caption && (
                        <Typography level="body-sm" sx={{ color: '#eee', textAlign: 'center', mb: 0.5 }}>
                            {photo.caption}
                        </Typography>
                    )}
                    <Typography level="body-xs" sx={{ color: '#777', textAlign: 'center' }}>
                        Roda do rato ou duplo clique para ampliar · arraste para percorrer a foto · setas para mudar de foto
                    </Typography>
                </Box>
            </Box>
        </Modal>
    );
}
