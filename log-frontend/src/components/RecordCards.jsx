import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';

/**
 * Cartão de um registo, para substituir uma linha de tabela em ecrã estreito.
 *
 * `highlight` pinta o fundo — usa-se nos tickets que passaram do prazo, para a
 * mesma informação que a linha vermelha dá na tabela.
 */
export function RecordCard({ children, onClick, highlight = false }) {
    return (
        <Box
            onClick={onClick}
            sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 'sm',
                p: 1.5,
                mb: 1,
                bgcolor: highlight ? '#ffebee' : '#fff',
                cursor: onClick ? 'pointer' : 'default',
                '&:active': onClick ? { bgcolor: highlight ? '#ffcdd2' : '#fafafa' } : undefined,
            }}
        >
            {children}
        </Box>
    );
}

/** Primeira linha do cartão: o número à esquerda, a data ou o estado à direita. */
export function CardHeader({ left, right }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography level="title-sm" sx={{ color: '#f57c00', fontWeight: 'bold' }}>{left}</Typography>
            {right && <Typography level="body-xs" sx={{ color: '#777' }}>{right}</Typography>}
        </Box>
    );
}

/** Campo com etiqueta, para o que não cabe no cabeçalho. */
export function CardField({ label, children }) {
    if (children === null || children === undefined || children === '') return null;
    return (
        <Typography level="body-sm" sx={{ color: '#555' }}>
            <Box component="span" sx={{ color: '#999' }}>{label}: </Box>
            {children}
        </Typography>
    );
}

/** Linha das etiquetas coloridas. */
export function CardChips({ children }) {
    return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.75 }}>{children}</Box>
    );
}

/** Rodapé com os botões, alinhados à direita. */
export function CardActions({ children }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>{children}</Box>
    );
}
