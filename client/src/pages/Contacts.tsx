import React, { useState } from 'react';
import { Search, UserPlus, Users, Phone, MessageCircle } from 'lucide-react';
import { Navbar } from '../components/Navbar';

interface Contact {
  id: string;
  name: string;
  phone: string;
  isOnline: boolean;
  lastSeen?: string;
}

// Demo kontaktlar
const demoContacts: Contact[] = [
  { id: '1', name: 'Ali Valiyev', phone: '+998901234567', isOnline: true },
  { id: '2', name: 'Sardor Karimov', phone: '+998901234568', isOnline: false, lastSeen: '10 daqiqa oldin' },
  { id: '3', name: 'Dilshod Rahimov', phone: '+998901234569', isOnline: true },
  { id: '4', name: 'Jasur Toshmatov', phone: '+998901234570', isOnline: false, lastSeen: '1 soat oldin' },
  { id: '5', name: 'Bekzod Aliyev', phone: '+998901234571', isOnline: false, lastSeen: 'kecha' },
];

export const Contacts: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts] = useState<Contact[]>(demoContacts);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  // Kontaktlarni alifbo bo'yicha guruhlash
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const letter = contact.name.charAt(0).toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  return (
    <div className="min-h-screen bg-telegram-bg flex">
      <Navbar />
      
      <div className="flex-1 md:ml-0 mt-14 md:mt-0 mb-16 md:mb-0">
        {/* Header */}
        <div className="sticky top-14 md:top-0 bg-telegram-bg-light border-b border-telegram-bg-lighter p-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-telegram-text flex items-center gap-2">
              <Users className="text-telegram-blue" size={24} />
              Kontaktlar
            </h1>
            <button className="p-2 rounded-lg bg-telegram-blue hover:bg-telegram-blue-dark transition-colors">
              <UserPlus size={20} className="text-white" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-telegram-text-secondary" />
            <input
              type="text"
              placeholder="Kontakt qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-telegram-bg text-telegram-text placeholder-telegram-text-secondary focus:outline-none focus:ring-2 focus:ring-telegram-blue/50"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="p-4">
          {Object.keys(groupedContacts).sort().map(letter => (
            <div key={letter} className="mb-4">
              <h2 className="text-telegram-blue font-bold text-sm mb-2 px-2">{letter}</h2>
              <div className="space-y-1">
                {groupedContacts[letter].map(contact => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-telegram-bg-light transition-colors cursor-pointer"
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-telegram-blue to-telegram-blue-light flex items-center justify-center text-white font-bold">
                        {contact.name.charAt(0)}
                      </div>
                      {contact.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-telegram-success rounded-full border-2 border-telegram-bg" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-telegram-text truncate">{contact.name}</p>
                      <p className="text-sm text-telegram-text-secondary">
                        {contact.isOnline ? 'online' : contact.lastSeen}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg hover:bg-telegram-bg-lighter transition-colors">
                        <MessageCircle size={20} className="text-telegram-text-secondary" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-telegram-bg-lighter transition-colors">
                        <Phone size={20} className="text-telegram-text-secondary" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredContacts.length === 0 && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto mb-3 text-telegram-text-secondary opacity-50" />
              <p className="text-telegram-text-secondary">Kontaktlar topilmadi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
