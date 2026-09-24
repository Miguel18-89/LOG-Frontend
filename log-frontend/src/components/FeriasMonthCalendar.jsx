import { useMemo } from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import {
    WEEKDAYS_SHORT, colorForIndex, buildMonthWeeks, buildVacationMap,
    localDateStr, isWeekend,
} from '../utils/feriasCalendar';

/** Bola de um colaborador: cheia quando aprovado, só contorno quando pendente. */
function Dot({ color, filled, title }) {
    return (
        <Box
            title={title}
            sx={{
                width: 10, height: 10, borderRadius: '50%',
                border: `1.5px solid ${color}`,
                bgcolor: filled ? color : 'transparent',
                flexShrink: 0,
            }}
        />
    );
}

/**
 * Calendário mensal de férias, com uma bola por colaborador em cada dia.
 *
 * É o mesmo desenho da app: com doze colaboradores, a grelha do ano inteiro só
 * se lê num monitor grande, e mesmo aí obriga a contar colunas. Um mês de cada
 * vez responde à pergunta que se faz de facto — quem está fora nesta semana.
 */
export default function FeriasMonthCalendar({ year, month, vacations, employees, loading }) {
    const weeks = useMemo(() => buildMonthWeeks(year, month), [year, month]);
    const vacationMap = useMemo(() => buildVacationMap(vacations), [vacations]);

    const employeesWithColor = useMemo(
        () => employees.map((e, i) => ({ ...e, color: colorForIndex(i) })),
        [employees],
    );

    // Só entram na legenda os colaboradores que têm alguma coisa este mês;
    // com doze pessoas, a legenda completa ocupava mais do que o calendário.
    const employeesThisMonth = useMemo(
        () => employeesWithColor.filter(e =>
            weeks.some(week => week.some(d => d && vacationMap[`${e.id}|${localDateStr(d)}`]))),
        [employeesWithColor, weeks, vacationMap],
    );

    return (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 'sm', overflow: 'hidden' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {WEEKDAYS_SHORT.map(w => (
                        <Box key={w} sx={{
                            bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd',
                            py: 0.5, textAlign: 'center',
                        }}>
                            <Typography level="body-xs" sx={{ fontWeight: 'bold', color: '#555' }}>{w}</Typography>
                        </Box>
                    ))}

                    {weeks.flat().map((d, i) => {
                        if (!d) return <Box key={`v${i}`} sx={{ minHeight: 58, bgcolor: '#fcfcfc' }} />;
                        const dateStr = localDateStr(d);
                        const dayEmployees = employeesWithColor.filter(e => vacationMap[`${e.id}|${dateStr}`]);
                        return (
                            <Box key={dateStr} sx={{
                                minHeight: 58, p: 0.5,
                                borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0',
                                bgcolor: isWeekend(d) ? '#fafafa' : '#fff',
                            }}>
                                <Typography level="body-xs" sx={{ color: '#666' }}>{d.getDate()}</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '3px', mt: 0.25 }}>
                                    {dayEmployees.map(e => (
                                        <Dot
                                            key={e.id}
                                            color={e.color}
                                            filled={vacationMap[`${e.id}|${dateStr}`].status === 'aprovado'}
                                            title={`${e.fullName} — ${vacationMap[`${e.id}|${dateStr}`].status}`}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            {loading ? (
                <Typography level="body-sm" sx={{ color: '#888', mt: 1 }}>A carregar...</Typography>
            ) : (
                <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <Dot color="#666" filled />
                        <Typography level="body-xs" sx={{ color: '#666' }}>Aprovado</Typography>
                        <Box sx={{ width: 12 }} />
                        <Dot color="#666" />
                        <Typography level="body-xs" sx={{ color: '#666' }}>Pendente</Typography>
                    </Box>
                    {employeesThisMonth.length === 0 ? (
                        <Typography level="body-xs" sx={{ color: '#999' }}>
                            Sem férias registadas neste mês.
                        </Typography>
                    ) : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                            {employeesThisMonth.map(e => (
                                <Box key={e.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: e.color }} />
                                    <Typography level="body-xs" sx={{ color: '#444' }}>{e.fullName}</Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}
