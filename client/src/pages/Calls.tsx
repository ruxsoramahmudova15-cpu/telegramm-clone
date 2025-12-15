import React, { useState } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video, Search } from 'lucide-react';
import { Navbar } from '../components/Navbar';

interface Call {
  id: string;
  name: string;
  type: 'incoming' | 'outgoing' | 'missed';
  isVideo: boolean;
  time: string;
  duration?: string;
}

// Demo qo'ng'iroqlar
const demoCalls: Call[] = [
  { id: '1', name: 'Ali Valiyev', type: 'incoming', isVideo: false, time: 'Bugun, 14:30', duration: '5:23' },
  { id: '2', name: 'Sardor Karimov', type: 'missed', isVideo: true, time: 'Bugun, 12:15' },
  { id: '3', name: 'Dilshod Rahimov', type: 'outgoing', isVideo: false, time: 'Kecha, 18:45', duration: '12:07' },
  { id: '4', name: 'Jasur Toshmatov', type: 'missed', isVideo: false, time: 'Kecha, 10:30' },
  { id: '5', name: 'Bekzod Aliyev', type: 'incoming', isVideo: true, time: '2 kun oldin', duration: '45:12' },
  { id: '6', name: 'Ali Valiyev', type: 'outgoing', isVideo: false, time: '3 kun oldin', duration: '2:45' },
];

export const Calls: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [calls] = useState<Call[]>(demoCalls);

  const filteredCalls = calls.filter(call =>
    call.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCallIcon = (type: Call['type']) => {
    switch (type) {
      case 'incoming':
        return <PhoneIncoming size={16} className="text-telegram-success" />;
      case 'outgoing':
        return <PhoneOutgoing size={16} className="text-telegram-blue" />;
      case 'missed':
        return <PhoneMissed size={16} className="text-telegram-error" />;
    }
  };

  const getCallColor = (type: Call['type']) => {
    switch (type) {
      case 'incoming':
        return 'text-telegram-success';
      case 'outgoing':
        return 'text-telegram-blue';
      case 'missed':
        return 'text-telegram-error';
    }
  };

  return (
    <div className="min-h-screen bg-telegram-bg flex">
      <Navbar />
      
      <div className="flex-1 md:ml-0 mt-14 md:mt-0 mb-16 md:mb-0">
        {/* Header */}
        <div className="sticky top-14 md:top-0 bg-telegram-bg-light border-b border-telegram-bg-lighter p-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-telegram-text flex items-center gap-2">
              <Phone className="text-telegram-blue" size={24} />
              Qo'ng'iroqlar
            </h1>
            <button className="p-2 rounded-lg bg-telegram-blue hover:bg-telegram-blue-dark transition-colors">
              <Phone size={20} className="text-white" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-telegram-text-secondary" />
            <input
              type="text"
              placeholder="Qo'ng'iroqlarni qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-telegram-bg text-telegram-text placeholder-telegram-text-secondary focus:outline-none focus:ring-2 focus:ring-telegram-blue/50"
            />
          </div>
        </div>

        {/* Calls List */}
        <div className="p-4 space-y-2">
          {filteredCalls.map(call => (
            <div
              key={call.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-telegram-bg-light transition-colors cursor-pointer"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-telegram-blue to-telegram-blue-light flex items-center justify-center text-white font-bold">
                {call.name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${call.type === 'missed' ? 'text-telegram-error' : 'text-telegram-text'}`}>
                  {call.name}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  {getCallIcon(call.type)}
                  <span className={getCallColor(call.type)}>
                    {call.type === 'incoming' ? 'Kiruvchi' : call.type === 'outgoing' ? 'Chiquvchi' : 'O\'tkazib yuborilgan'}
                  </span>
                  {call.isVideo && <Video size={14} className="text-telegram-text-secondary" />}
                </div>
              </div>

              {/* Time & Duration */}
              <div className="text-right">
                <p className="text-sm text-telegram-text-secondary">{call.time}</p>
                {call.duration && (
                  <p className="text-xs text-telegram-text-secondary">{call.duration}</p>
                )}
              </div>

              {/* Call Button */}
              <button className="p-2 rounded-lg hover:bg-telegram-bg-lighter transition-colors">
                {call.isVideo ? (
                  <Video size={20} className="text-telegram-blue" />
                ) : (
                  <Phone size={20} className="text-telegram-blue" />
                )}
              </button>
            </div>
          ))}

          {filteredCalls.length === 0 && (
            <div className="text-center py-12">
              <Phone size={48} className="mx-auto mb-3 text-telegram-text-secondary opacity-50" />
              <p className="text-telegram-text-secondary">Qo'ng'iroqlar topilmadi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
