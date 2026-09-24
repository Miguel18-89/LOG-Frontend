import useMediaQuery from '@mui/material/useMediaQuery';

/**
 * Abaixo desta largura as tabelas deixam de caber e dão lugar a cartões.
 * 900px apanha todos os telemóveis e ainda os tablets em retrato, que têm o
 * mesmo problema: as tabelas desta plataforma pedem entre 950 e 1100px.
 */
export const PHONE_QUERY = '(max-width: 900px)';

export function useIsPhone() {
    return useMediaQuery(PHONE_QUERY);
}
