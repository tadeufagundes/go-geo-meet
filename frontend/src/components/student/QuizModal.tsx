import React, { useState } from 'react';
import { CheckCircle, XCircle, Send, HelpCircle } from 'lucide-react';

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

interface QuizModalProps {
    question: QuizQuestion;
    onSubmit: (answerIndex: number) => void;
    onClose: () => void;
}

export function QuizModal({ question, onSubmit, onClose }: QuizModalProps) {
    const [selected, setSelected] = useState<number | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleConfirm = () => {
        if (selected !== null) {
            setIsSubmitted(true);
            onSubmit(selected);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-md">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-purple-600 p-4 text-white flex items-center gap-3">
                    <HelpCircle className="w-6 h-6" />
                    <h3 className="font-bold text-lg">Desafio de Inglês! 🚀</h3>
                </div>

                <div className="p-6">
                    <p className="text-gray-800 text-xl font-medium mb-6">
                        {question.question}
                    </p>

                    <div className="space-y-3">
                        {question.options.map((option, index) => {
                            let className = "w-full text-left p-4 rounded-xl border-2 transition-all ";
                            
                            if (isSubmitted) {
                                if (index === question.correctIndex) {
                                    className += "border-green-500 bg-green-50 text-green-700";
                                } else if (index === selected) {
                                    className += "border-red-500 bg-red-50 text-red-700";
                                } else {
                                    className += "border-gray-100 text-gray-400";
                                }
                            } else {
                                className += selected === index 
                                    ? "border-purple-600 bg-purple-50 text-purple-700" 
                                    : "border-gray-100 hover:border-purple-200 text-gray-700";
                            }

                            return (
                                <button
                                    key={index}
                                    disabled={isSubmitted}
                                    onClick={() => setSelected(index)}
                                    className={className}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{option}</span>
                                        {isSubmitted && index === question.correctIndex && <CheckCircle className="w-5 h-5" />}
                                        {isSubmitted && index === selected && index !== question.correctIndex && <XCircle className="w-5 h-5" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {isSubmitted && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-in slide-in-from-bottom-2">
                            <p className="text-blue-800 text-sm leading-relaxed">
                                <strong>Por que?</strong> {question.explanation}
                            </p>
                            {/* @ts-ignore */}
                            {question.followUpPrompt && (
                                <div className="mt-4 p-3 bg-white/50 rounded-lg border border-blue-200">
                                    <p className="text-blue-900 text-xs font-bold uppercase mb-1">Missão 🎯</p>
                                    {/* @ts-ignore */}
                                    <p className="text-blue-800 text-sm italic">{question.followUpPrompt}</p>
                                </div>
                            )}
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="bg-navy-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-navy-800 transition-colors"
                                >
                                    Continuar Aula
                                </button>
                            </div>
                        </div>
                    )}

                    {!isSubmitted && (
                        <button
                            disabled={selected === null}
                            onClick={handleConfirm}
                            className="w-full mt-8 bg-purple-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-all disabled:opacity-50 disabled:grayscale"
                        >
                            <Send className="w-5 h-5" />
                            Enviar Resposta
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
