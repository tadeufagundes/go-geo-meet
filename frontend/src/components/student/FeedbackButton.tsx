import { HelpCircle } from 'lucide-react';
import { useFeedback } from '@/hooks/useFeedback';

interface FeedbackButtonProps {
    sessionId: string;
    alunoId: string;
    alunoName: string;
}

export function FeedbackButton({ sessionId, alunoId, alunoName }: FeedbackButtonProps) {
    const { isConfused, isLoading, toggleFeedback } = useFeedback({
        sessionId,
        alunoId,
        alunoName,
    });

    return (
        <button
            onClick={toggleFeedback}
            disabled={isLoading}
            className={`
        relative flex items-center gap-2 px-4 py-2 rounded-full
        font-medium transition-all duration-200
        ${isConfused
                    ? 'bg-cyan-500 text-white animate-confused shadow-lg shadow-cyan-500/30'
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                }
        ${isLoading ? 'opacity-70 cursor-wait' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2
      `}
            aria-label={isConfused ? 'Remover indicação de dúvida' : 'Indicar que tenho dúvida'}
            title={isConfused ? 'Clique para remover a indicação de dúvida' : 'Clique para indicar que tem uma dúvida'}
        >
            <HelpCircle
                className={`w-5 h-5 ${isConfused ? 'text-white' : 'text-cyan-500'}`}
                aria-hidden="true"
            />
            <span className="text-sm">
                {isConfused ? 'Com dúvida' : 'Tenho dúvida'}
            </span>

            {/* Active indicator dot */}
            {isConfused && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full border-2 border-white" />
            )}
        </button>
    );
}
