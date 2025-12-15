import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, MessageCircle, ArrowRight, ArrowLeft, User } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

type Step = 'phone' | 'name' | 'code';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { sendOTP, verifyOTP } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first code input when step changes to 'code'
  useEffect(() => {
    if (step === 'code' && codeInputRefs.current[0]) {
      codeInputRefs.current[0].focus();
    }
  }, [step]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setIsLoading(true);
    setError('');

    const result = await sendOTP(phone);

    if (result.success) {
      if (result.isNewUser) {
        setIsNewUser(true);
        setStep('name');
      } else {
        setStep('code');
      }
    } else {
      setError(result.errors?.join(', ') || result.message);
    }
    setIsLoading(false);
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsLoading(true);
    setError('');

    const result = await sendOTP(phone, displayName);

    if (result.success) {
      setStep('code');
    } else {
      setError(result.errors?.join(', ') || result.message);
    }
    setIsLoading(false);
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleCodeSubmit(newCode.join(''));
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      handleCodeSubmit(pastedData);
    }
  };

  const handleCodeSubmit = async (codeString?: string) => {
    const finalCode = codeString || code.join('');
    if (finalCode.length !== 6) return;

    setIsLoading(true);
    setError('');

    const result = await verifyOTP(phone, finalCode);

    if (result.success) {
      navigate('/chat');
    } else {
      setError(result.errors?.join(', ') || result.message);
      setCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    }
    setIsLoading(false);
  };

  const goBack = () => {
    setError('');
    if (step === 'code') {
      setCode(['', '', '', '', '', '']);
      setStep(isNewUser ? 'name' : 'phone');
    } else if (step === 'name') {
      setStep('phone');
    }
  };

  return (
    <div className="min-h-screen bg-telegram-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-telegram-blue to-telegram-blue-light mb-4 shadow-lg">
            <MessageCircle size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-telegram-text">Telegram</h1>
          <p className="text-telegram-text-secondary mt-2">
            {step === 'phone' && 'Telefon raqamingizni kiriting'}
            {step === 'name' && 'Ismingizni kiriting'}
            {step === 'code' && 'Tasdiqlash kodini kiriting'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-telegram-bg-light rounded-2xl p-8 shadow-xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-telegram-error/10 border border-telegram-error/20">
              <p className="text-telegram-error text-sm text-center">{error}</p>
            </div>
          )}

          {/* Step 1: Phone Number */}
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="text-center mb-4">
                <p className="text-telegram-text-secondary text-sm">
                  Telegram hisobingizga kirish uchun telefon raqamingizni kiriting
                </p>
              </div>

              <Input
                label="Telefon raqam"
                type="tel"
                name="phone"
                placeholder="+998 90 123 45 67"
                icon={Phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
                required
              />

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Davom etish
                <ArrowRight size={20} />
              </Button>
            </form>
          )}

          {/* Step 2: Name (for new users) */}
          {step === 'name' && (
            <form onSubmit={handleNameSubmit} className="space-y-6">
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-2 text-telegram-blue hover:text-telegram-blue-light transition-colors"
              >
                <ArrowLeft size={20} />
                Orqaga
              </button>

              <div className="text-center mb-4">
                <p className="text-telegram-text-secondary text-sm">
                  Siz yangi foydalanuvchisiz. Ismingizni kiriting.
                </p>
              </div>

              <Input
                label="Ismingiz"
                type="text"
                name="displayName"
                placeholder="Ismingizni kiriting"
                icon={User}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoFocus
                required
              />

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Davom etish
                <ArrowRight size={20} />
              </Button>
            </form>
          )}

          {/* Step 3: OTP Code */}
          {step === 'code' && (
            <div className="space-y-6">
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-2 text-telegram-blue hover:text-telegram-blue-light transition-colors"
              >
                <ArrowLeft size={20} />
                Orqaga
              </button>

              <div className="text-center">
                <p className="text-telegram-text font-medium mb-1">{phone}</p>
                <p className="text-telegram-text-secondary text-sm">
                  Ushbu raqamga yuborilgan 6 xonali kodni kiriting
                </p>
              </div>

              {/* OTP Input */}
              <div className="flex justify-center gap-3" onPaste={handleCodePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (codeInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-telegram-bg text-telegram-text border-2 border-transparent focus:border-telegram-blue focus:outline-none transition-colors"
                    disabled={isLoading}
                  />
                ))}
              </div>

              {isLoading && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telegram-blue" />
                </div>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => sendOTP(phone, displayName || undefined)}
                  className="text-telegram-blue hover:text-telegram-blue-light text-sm transition-colors"
                  disabled={isLoading}
                >
                  Kodni qayta yuborish
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-telegram-text-secondary text-sm mt-6">
          © 2024 Telegram Clone. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </div>
  );
};
