import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, LogIn, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
    const navigate = useNavigate();
    const { signIn, signInAnonymously } = useAuth();
    const [role, setRole] = useState<'teacher' | 'student'>('student');
    
    // Form states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [sessionCode, setSessionCode] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (role === 'teacher') {
                if (!email || !password) return;
                // Teacher Login: Email & Password (same as Synapse)
                await signIn(email, password);
                navigate('/teacher');
            } else {
                if (!name || !sessionCode) return;
                // Student Login: Anonymous with Name
                await signInAnonymously(name);
                navigate(`/student/room/${sessionCode}?name=${encodeURIComponent(name)}`);
            }
        } catch (err) {
            console.error('Login error:', err);
            if (role === 'teacher') {
                setError('Erro ao entrar. Verifique seu e-mail e senha.');
            } else {
                setError('Erro ao entrar na aula. O login anônimo pode estar desativado no Firebase.');
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500 rounded-2xl mb-4">
                        <Video className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Go Geo Meet</h1>
                    <p className="text-gray-400 mt-2">Plataforma de aulas online</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* Role Toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                        <button
                            type="button"
                            onClick={() => setRole('student')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${role === 'student'
                                    ? 'bg-white text-navy-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Sou Aluno
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('teacher')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${role === 'teacher'
                                    ? 'bg-white text-navy-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Sou Professor
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                                {error}
                            </div>
                        )}

                        {role === 'teacher' ? (
                            // Teacher Form Fields
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        E-mail
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="seu@email.com"
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Senha
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Sua senha"
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            // Student Form Fields
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Seu nome
                                    </label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Digite seu nome"
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Código da aula
                                    </label>
                                    <input
                                        type="text"
                                        value={sessionCode}
                                        onChange={(e) => setSessionCode(e.target.value)}
                                        placeholder="Ex: GoGeo-MAT7A-abc123"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-cyan-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    {role === 'teacher' ? 'Entrar com Email' : 'Entrar na Aula'}
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    Plataforma Go Geo - Todos os direitos reservados
                </p>
            </div>
        </div>
    );
}


