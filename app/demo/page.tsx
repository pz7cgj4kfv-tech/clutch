"use client";
import React, { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Screen =
  | "home"
  | "onboarding1"
  | "onboarding2"
  | "onboarding3"
  | "discover"
  | "profile"
  | "propose"
  | "propose2"
  | "propose3"
  | "inbox"
  | "rdv-active"
  | "checkin"
  | "events"
  | "event-detail"
  | "my-profile"
  | "premium"
  | "sos";

// ─── Data ────────────────────────────────────────────────────────────────────
const profiles = [
  { id: 1, name: "Clara", age: 28, distance: "0.4 km", score: 98, photo: "👩‍🦱", bio: "Architecte, aime les cafés indie et la randonnée.", active: true, interests: ["Café", "Rando", "Design"] },
  { id: 2, name: "Sophie", age: 31, distance: "0.8 km", score: 92, photo: "👩", bio: "Journaliste. Toujours partante pour un café impromptu.", active: true, interests: ["Lecture", "Voyages", "Cinéma"] },
  { id: 3, name: "Léa", age: 26, distance: "1.2 km", score: 88, photo: "👩‍🦰", bio: "Dev frontend le jour, photographe le soir.", active: false, interests: ["Photo", "Tech", "Yoga"] },
  { id: 4, name: "Emma", age: 33, distance: "1.5 km", score: 100, photo: "🧑‍🦱", bio: "Prof de yoga. J'adore les discussions profondes autour d'un thé.", active: true, interests: ["Yoga", "Méditation", "Nature"] },
];

const events = [
  { id: 1, title: "Concert Jazz — Chorus", time: "Ce soir 20h", price: 25, seats: 1, host: "Marc", hostScore: 96, photo: "🎷", place: "Chorus Jazz Club, Lausanne" },
  { id: 2, title: "Expo photo — MCBA", time: "Demain 14h", price: 0, seats: 2, host: "Léa", hostScore: 88, photo: "📸", place: "MCBA, Place de la Riponne" },
  { id: 3, title: "Stand-up Comedy", time: "Vendredi 21h", price: 18, seats: 1, host: "Thomas", hostScore: 94, photo: "🎤", place: "Le Romandie, Lausanne" },
];

const cafes = [
  { id: 1, name: "Café de Grancy", address: "Av. du Général-Guisan 52", partner: true },
  { id: 2, name: "Holy Cow!", address: "Rue de Bourg 17", partner: true },
  { id: 3, name: "Café Romand", address: "Place Saint-François 2", partner: false },
  { id: 4, name: "Lomi Coffee", address: "Rue Mauborget 5", partner: true },
];

// ─── Components ──────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 95 ? "text-green-400" : score >= 85 ? "text-yellow-400" : "text-red-400";
  const label = score >= 95 ? "●" : score >= 85 ? "●" : "●";
  return <span className={`${color} font-bold text-sm`}>{label} {score}%</span>;
}

function TabBar({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  const tabs = [
    { id: "discover", icon: "🔍", label: "Explorer" },
    { id: "events", icon: "🎟️", label: "Événements" },
    { id: "inbox", icon: "💬", label: "Inbox" },
    { id: "my-profile", icon: "👤", label: "Moi" },
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 flex">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => go(t.id as Screen)}
          className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-xs transition-colors ${screen === t.id ? "text-red-500" : "text-zinc-500"}`}
        >
          <span className="text-lg">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function TopBar({ title, back, go, showSOS }: { title: string; back?: Screen; go: (s: Screen) => void; showSOS?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 pt-12 pb-4">
      {back ? (
        <button onClick={() => go(back)} className="text-zinc-400 text-sm">← Retour</button>
      ) : (
        <span className="text-2xl font-black text-white">CLU<span className="text-red-500">TCH</span></span>
      )}
      <span className="text-white font-semibold">{title}</span>
      {showSOS ? (
        <button onClick={() => go("sos")} className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">SOS</button>
      ) : (
        <div className="w-10" />
      )}
    </div>
  );
}

// ─── Screens ─────────────────────────────────────────────────────────────────

function HomeScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="mb-6">
          <h1 className="text-6xl font-black tracking-tight text-white text-center">
            CLU<span className="text-red-500">TCH</span>
          </h1>
        </div>
        <p className="text-zinc-400 text-lg tracking-widest uppercase text-center mb-2">be spontaneous</p>
        <p className="text-zinc-500 text-sm text-center max-w-xs mt-4 leading-relaxed">
          Un café. Maintenant. Près d&apos;ici.<br />Propose un RDV, l&apos;autre a 2h pour répondre.
        </p>
        <div className="mt-10 flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => go("onboarding1")} className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 rounded-2xl text-lg transition-colors">
            Je m&apos;inscris
          </button>
          <button onClick={() => go("discover")} className="w-full border border-zinc-700 text-zinc-400 font-medium py-4 rounded-2xl transition-colors">
            Voir la démo →
          </button>
        </div>
        <p className="mt-12 text-zinc-700 text-xs text-center">Lausanne · Suisse romande · Bêta 2025</p>
      </div>
    </div>
  );
}

function Onboarding1({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="flex flex-col h-full bg-zinc-950 px-6">
      <div className="pt-16 mb-8">
        <div className="text-zinc-500 text-sm mb-2">Étape 1 / 3</div>
        <div className="h-1 bg-zinc-800 rounded-full"><div className="h-1 bg-red-500 rounded-full w-1/3" /></div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Tes photos</h2>
      <p className="text-zinc-400 text-sm mb-8">Au moins 2 photos récentes. Chaque photo est vérifiée manuellement par notre équipe.</p>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[0,1,2,3,4,5].map(i => (
          <div key={i} className={`aspect-square rounded-2xl flex items-center justify-center text-3xl ${i === 0 ? "bg-zinc-700 text-4xl" : i === 1 ? "bg-zinc-700" : "bg-zinc-900 border border-dashed border-zinc-700"}`}>
            {i === 0 ? "👩‍🦱" : i === 1 ? "☕" : "+"}
          </div>
        ))}
      </div>
      <div className="bg-zinc-900 rounded-2xl p-4 mb-8 flex gap-3">
        <span className="text-yellow-400 text-xl">⚠️</span>
        <p className="text-zinc-400 text-xs leading-relaxed">Photos vérifiées sous 2h. Selfie en temps réel requis pour le badge <span className="text-green-400 font-semibold">✓ Vérifié</span></p>
      </div>
      <button onClick={() => go("onboarding2")} className="mt-auto mb-8 w-full bg-red-500 text-white font-semibold py-4 rounded-2xl">
        Continuer →
      </button>
    </div>
  );
}

function Onboarding2({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="flex flex-col h-full bg-zinc-950 px-6">
      <div className="pt-16 mb-8">
        <div className="text-zinc-500 text-sm mb-2">Étape 2 / 3</div>
        <div className="h-1 bg-zinc-800 rounded-full"><div className="h-1 bg-red-500 rounded-full w-2/3" /></div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Ton profil</h2>
      <p className="text-zinc-400 text-sm mb-6">Court et authentique. Les gens lisent vraiment.</p>
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-zinc-500 text-xs mb-1 block">Prénom</label>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white">Clara</div>
        </div>
        <div>
          <label className="text-zinc-500 text-xs mb-1 block">Âge</label>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white">28 ans</div>
        </div>
        <div>
          <label className="text-zinc-500 text-xs mb-1 block">Bio (max 280 caractères)</label>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm">Architecte, aime les cafés indie et la randonnée. Toujours partante pour une bonne discussion.</div>
        </div>
        <div>
          <label className="text-zinc-500 text-xs mb-1 block">Intérêts</label>
          <div className="flex flex-wrap gap-2">
            {["☕ Café", "🥾 Rando", "🎨 Design", "📚 Lecture", "🎵 Musique"].map(tag => (
              <span key={tag} className="bg-red-500/20 text-red-400 text-xs px-3 py-1 rounded-full border border-red-500/30">{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <button onClick={() => go("onboarding3")} className="mt-auto mb-8 w-full bg-red-500 text-white font-semibold py-4 rounded-2xl">
        Continuer →
      </button>
    </div>
  );
}

function Onboarding3({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="flex flex-col h-full bg-zinc-950 px-6">
      <div className="pt-16 mb-8">
        <div className="text-zinc-500 text-sm mb-2">Étape 3 / 3</div>
        <div className="h-1 bg-zinc-800 rounded-full"><div className="h-1 bg-red-500 rounded-full w-full" /></div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Tes préférences</h2>
      <p className="text-zinc-400 text-sm mb-6">Pour te montrer les bons profils.</p>
      <div className="space-y-5 mb-6">
        <div>
          <label className="text-zinc-500 text-xs mb-2 block">Je cherche</label>
          <div className="flex gap-2">
            {["Femmes", "Hommes", "Les deux"].map((opt, i) => (
              <button key={opt} className={`flex-1 py-2 rounded-xl text-sm font-medium border ${i === 0 ? "bg-red-500 border-red-500 text-white" : "border-zinc-700 text-zinc-400"}`}>{opt}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-zinc-500 text-xs mb-2 block">Tranche d&apos;âge : 24 — 38 ans</label>
          <div className="h-2 bg-zinc-800 rounded-full relative">
            <div className="absolute left-1/4 right-1/4 h-2 bg-red-500 rounded-full" />
          </div>
        </div>
        <div>
          <label className="text-zinc-500 text-xs mb-2 block">Rayon maximum : 3 km</label>
          <div className="h-2 bg-zinc-800 rounded-full relative">
            <div className="absolute left-0 right-2/3 h-2 bg-red-500 rounded-full" />
          </div>
        </div>
        <div>
          <label className="text-zinc-500 text-xs mb-2 block">Contact de confiance (pour le bouton SOS)</label>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-400 text-sm">+41 79 000 00 00</div>
        </div>
      </div>
      <button onClick={() => go("discover")} className="mt-auto mb-8 w-full bg-red-500 text-white font-semibold py-4 rounded-2xl">
        Commencer 🎉
      </button>
    </div>
  );
}

function DiscoverScreen({ go }: { go: (s: Screen) => void }) {
  const [filter, setFilter] = useState<"tous" | "actifs">("actifs");
  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="px-5 pt-12 pb-3 flex items-center justify-between">
        <span className="text-2xl font-black text-white">CLU<span className="text-red-500">TCH</span></span>
        <div className="flex items-center gap-2">
          <button onClick={() => go("premium")} className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-yellow-500/30">⭐ Premium</button>
          <button onClick={() => go("sos")} className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">SOS</button>
        </div>
      </div>
      <div className="px-5 mb-4 flex gap-2">
        {["actifs", "tous"].map(f => (
          <button key={f} onClick={() => setFilter(f as "tous" | "actifs")} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? "bg-red-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>
            {f === "actifs" ? "🟢 Actifs maintenant" : "Tous"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-3">
        {profiles.filter(p => filter === "tous" || p.active).map(p => (
          <button key={p.id} onClick={() => go("profile")} className="w-full bg-zinc-900 rounded-2xl p-4 flex gap-4 items-center border border-zinc-800 hover:border-red-500/50 transition-colors text-left">
            <div className="w-16 h-16 rounded-2xl bg-zinc-700 flex items-center justify-center text-3xl flex-shrink-0">{p.photo}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-semibold">{p.name}, {p.age}</span>
                {p.active && <span className="w-2 h-2 bg-green-400 rounded-full" />}
              </div>
              <p className="text-zinc-400 text-xs mb-2 truncate">{p.bio}</p>
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 text-xs">📍 {p.distance}</span>
                <ScoreBadge score={p.score} />
              </div>
            </div>
            <span className="text-red-500 text-xl flex-shrink-0">→</span>
          </button>
        ))}
        <div className="bg-zinc-900/50 rounded-2xl p-4 border border-dashed border-zinc-700 text-center">
          <p className="text-zinc-500 text-sm">🔒 Basic : 4 RDV/mois</p>
          <button onClick={() => go("premium")} className="text-red-400 text-sm font-semibold mt-1">Passer Premium →</button>
        </div>
      </div>
      <TabBar screen="discover" go={go} />
    </div>
  );
}

function ProfileScreen({ go }: { go: (s: Screen) => void }) {
  const p = profiles[0];
  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <TopBar title="" back="discover" go={go} showSOS />
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-5">
          <div className="w-full h-64 bg-zinc-800 rounded-3xl flex items-center justify-center text-8xl mb-4">{p.photo}</div>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold text-white">{p.name}, {p.age}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-green-400 text-xs font-semibold">✓ Profil vérifié</span>
                <span className="text-zinc-500 text-xs">· 📍 {p.distance}</span>
              </div>
            </div>
            <div className="text-right">
              <ScoreBadge score={p.score} />
              <p className="text-zinc-500 text-xs mt-1">ponctualité</p>
            </div>
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed mb-4">{p.bio}</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {p.interests.map(i => (
              <span key={i} className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">{i}</span>
            ))}
          </div>
          <div className="bg-zinc-900 rounded-2xl p-4 mb-4">
            <p className="text-zinc-500 text-xs mb-1">Historique</p>
            <p className="text-white text-sm">12 RDV complétés · 0 no-show</p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-zinc-950 border-t border-zinc-800">
        <div className="flex gap-3">
          <button className="flex-1 border border-zinc-700 text-zinc-400 font-medium py-3 rounded-2xl">Bloquer</button>
          <button onClick={() => go("propose")} className="flex-2 bg-red-500 text-white font-semibold py-3 px-8 rounded-2xl">
            ☕ Proposer un café
          </button>
        </div>
      </div>
    </div>
  );
}

function ProposeScreen({ go }: { go: (s: Screen) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <TopBar title="Choisir un lieu" back="profile" go={go} />
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <p className="text-zinc-400 text-sm mb-4">Cafés, bars et restos près de toi. Les partenaires <span className="text-red-400">★</span> sont mis en avant.</p>
        <div className="space-y-3">
          {cafes.map(c => (
            <button key={c.id} onClick={() => setSelected(c.id)} className={`w-full rounded-2xl p-4 flex items-center gap-3 border transition-colors text-left ${selected === c.id ? "bg-red-500/10 border-red-500" : "bg-zinc-900 border-zinc-800"}`}>
              <span className="text-2xl">{c.partner ? "☕" : "🍽️"}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{c.name}</span>
                  {c.partner && <span className="text-red-400 text-xs font-bold">★ Partenaire</span>}
                </div>
                <p className="text-zinc-500 text-xs">{c.address}</p>
              </div>
              {selected === c.id && <span className="text-red-500 text-xl">✓</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-zinc-950 border-t border-zinc-800">
        <button onClick={() => go("propose2")} disabled={!selected} className={`w-full font-semibold py-4 rounded-2xl transition-colors ${selected ? "bg-red-500 text-white" : "bg-zinc-800 text-zinc-600"}`}>
          Choisir l&apos;heure →
        </button>
      </div>
    </div>
  );
}

function Propose2Screen({ go }: { go: (s: Screen) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const now = new Date();
  const slots = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now.getTime() + (i + 1) * 2 * 3600000);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
  });
  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <TopBar title="Choisir l'heure" back="propose" go={go} />
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex gap-3">
          <span className="text-red-400 text-xl">⏰</span>
          <p className="text-zinc-300 text-sm">Le RDV doit avoir lieu dans les <span className="text-red-400 font-bold">18 heures</span>. L&apos;autre a <span className="text-red-400 font-bold">2h</span> pour répondre.</p>
        </div>
        <p className="text-zinc-400 text-sm mb-4">Créneaux disponibles :</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {slots.map(s => (
            <button key={s} onClick={() => setSelected(s)} className={`py-3 rounded-xl font-semibold text-sm border transition-colors ${selected === s ? "bg-red-500 border-red-500 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-300"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-zinc-950 border-t border-zinc-800">
        <button onClick={() => go("propose3")} disabled={!selected} className={`w-full font-semibold py-4 rounded-2xl ${selected ? "bg-red-500 text-white" : "bg-zinc-800 text-zinc-600"}`}>
          Ajouter un message →
        </button>
      </div>
    </div>
  );
}

function Propose3Screen({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <TopBar title="Message (optionnel)" back="propose2" go={go} />
      <div className="flex-1 px-5 pb-32">
        <p className="text-zinc-400 text-sm mb-6">Un message sincère augmente significativement les chances d&apos;acceptation.</p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
          <p className="text-zinc-300 text-sm leading-relaxed">Salut Clara, j&apos;ai adoré ton profil. Je suis aussi passionné d&apos;architecture. Tu veux qu&apos;on se retrouve au Café de Grancy ce soir ?</p>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-4 mb-6 space-y-2">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wide">Récapitulatif</p>
          <div className="flex justify-between"><span className="text-zinc-400 text-sm">Pour</span><span className="text-white text-sm font-medium">Clara, 28 ans</span></div>
          <div className="flex justify-between"><span className="text-zinc-400 text-sm">Lieu</span><span className="text-white text-sm font-medium">Café de Grancy</span></div>
          <div className="flex justify-between"><span className="text-zinc-400 text-sm">Heure</span><span className="text-white text-sm font-medium">Ce soir 19h00</span></div>
          <div className="flex justify-between"><span className="text-zinc-400 text-sm">Expire dans</span><span className="text-red-400 text-sm font-bold">2h00</span></div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-zinc-950 border-t border-zinc-800 space-y-3">
        <button onClick={() => go("inbox")} className="w-full bg-red-500 text-white font-semibold py-4 rounded-2xl text-lg">
          ☕ Envoyer l&apos;invitation
        </button>
        <p className="text-zinc-600 text-xs text-center">RDV toujours dans un lieu public. Jamais à domicile.</p>
      </div>
    </div>
  );
}

function InboxScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-white">Mes invitations</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-4">
        {/* Reçue */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-yellow-500/40">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full">⏳ En attente</span>
            <span className="text-red-400 text-xs font-bold">Expire dans 1h22</span>
          </div>
          <div className="flex gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-zinc-700 flex items-center justify-center text-2xl">🧑‍🦱</div>
            <div>
              <p className="text-white font-semibold">Thomas, 32 ans <ScoreBadge score={96} /></p>
              <p className="text-zinc-400 text-xs">📍 Café de Grancy · Ce soir 19h30</p>
            </div>
          </div>
          <p className="text-zinc-300 text-sm italic mb-4">&quot;Salut ! J&apos;adore cet endroit, ça te dirait qu&apos;on se retrouve là-bas ?&quot;</p>
          <div className="flex gap-3">
            <button className="flex-1 border border-zinc-700 text-zinc-400 py-2.5 rounded-xl font-medium">Décliner</button>
            <button onClick={() => go("rdv-active")} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-semibold">✓ Accepter</button>
          </div>
        </div>
        {/* Envoyée */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-zinc-800 text-zinc-400 text-xs font-bold px-2 py-0.5 rounded-full">📤 Envoyée</span>
            <span className="text-zinc-500 text-xs">Expire dans 45min</span>
          </div>
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-xl bg-zinc-700 flex items-center justify-center text-2xl">👩‍🦱</div>
            <div>
              <p className="text-white font-semibold">Clara, 28 ans</p>
              <p className="text-zinc-400 text-xs">📍 Lomi Coffee · Ce soir 20h00</p>
            </div>
          </div>
        </div>
        {/* Accepté */}
        <div className="bg-green-500/10 rounded-2xl p-4 border border-green-500/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">✓ Accepté</span>
          </div>
          <div className="flex gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-zinc-700 flex items-center justify-center text-2xl">👩</div>
            <div>
              <p className="text-white font-semibold">Sophie, 31 ans</p>
              <p className="text-zinc-400 text-xs">📍 Holy Cow! · Demain 12h30</p>
            </div>
          </div>
          <button onClick={() => go("rdv-active")} className="w-full bg-green-500/20 text-green-400 font-medium py-2.5 rounded-xl text-sm">
            Voir le RDV →
          </button>
        </div>
      </div>
      <TabBar screen="inbox" go={go} />
    </div>
  );
}

function RdvActiveScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <TopBar title="RDV confirmé" back="inbox" go={go} showSOS />
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <div className="bg-green-500/10 border border-green-500/30 rounded-3xl p-5 mb-5 text-center">
          <div className="text-4xl mb-2">☕</div>
          <h2 className="text-white font-bold text-lg mb-1">Café de Grancy</h2>
          <p className="text-zinc-400 text-sm">Av. du Général-Guisan 52</p>
          <div className="mt-3 text-2xl font-black text-white">Ce soir 19h30</div>
          <p className="text-green-400 text-sm mt-1 font-semibold">Dans 2h15</p>
        </div>
        <div className="flex gap-3 mb-5">
          <div className="flex-1 bg-zinc-900 rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">🧑‍🦱</div>
            <p className="text-white text-sm font-semibold">Thomas</p>
            <ScoreBadge score={96} />
          </div>
          <div className="flex items-center text-zinc-500">☕</div>
          <div className="flex-1 bg-zinc-900 rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">👤</div>
            <p className="text-white text-sm font-semibold">Moi</p>
            <ScoreBadge score={98} />
          </div>
        </div>
        {/* Chat */}
        <div className="bg-zinc-900 rounded-2xl p-4 mb-4">
          <p className="text-zinc-500 text-xs font-semibold mb-3">💬 Chat — débloqué après acceptation</p>
          <div className="space-y-3">
            <div className="flex justify-start">
              <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-2 max-w-xs">
                <p className="text-white text-sm">Top ! Je serai là à 19h25 👍</p>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-red-500 rounded-2xl rounded-tr-sm px-4 py-2 max-w-xs">
                <p className="text-white text-sm">Parfait, à tout à l&apos;heure !</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900/50 rounded-2xl p-4 border border-dashed border-zinc-700 mb-4">
          <p className="text-zinc-500 text-xs mb-2">🔒 Partager ce RDV avec un ami</p>
          <button className="text-red-400 text-sm font-semibold">Envoyer le lien de sécurité →</button>
        </div>
        <p className="text-zinc-600 text-xs text-center">Annulation possible jusqu&apos;à 1h avant le RDV sans pénalité</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-zinc-950 border-t border-zinc-800">
        <button onClick={() => go("checkin")} className="w-full bg-green-500 text-white font-semibold py-4 rounded-2xl text-lg">
          📍 Check-in au lieu
        </button>
      </div>
    </div>
  );
}

function CheckinScreen({ go }: { go: (s: Screen) => void }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex flex-col h-full bg-zinc-950 items-center justify-center px-6 text-center">
      {!done ? (
        <>
          <div className="text-6xl mb-6">📍</div>
          <h2 className="text-2xl font-bold text-white mb-2">Check-in GPS</h2>
          <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
            Confirme ta présence au <span className="text-white font-semibold">Café de Grancy</span>.<br/>
            Tu dois être à moins de 50m du lieu.
          </p>
          <div className="bg-zinc-900 rounded-2xl p-4 w-full mb-8">
            <p className="text-zinc-500 text-xs mb-1">Ta position détectée</p>
            <p className="text-white font-semibold">📍 À 23m du café</p>
            <p className="text-green-400 text-sm mt-1">✓ Dans la zone</p>
          </div>
          <button onClick={() => setDone(true)} className="w-full bg-green-500 text-white font-semibold py-4 rounded-2xl text-lg">
            Confirmer ma présence
          </button>
        </>
      ) : (
        <>
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Check-in validé !</h2>
          <p className="text-zinc-400 text-sm mb-2">Ton score de ponctualité a augmenté.</p>
          <ScoreBadge score={99} />
          <p className="text-zinc-500 text-xs mt-6 mb-8">Après le RDV, une évaluation mutuelle anonyme sera disponible.</p>
          <button onClick={() => go("discover")} className="w-full bg-red-500 text-white font-semibold py-4 rounded-2xl">
            Retour à l&apos;app
          </button>
        </>
      )}
    </div>
  );
}

function EventsScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="px-5 pt-12 pb-3">
        <h1 className="text-xl font-bold text-white mb-1">Événements</h1>
        <p className="text-zinc-500 text-sm">Des billets à partager, une activité à deux.</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-4">
        <button onClick={() => go("event-detail")} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden text-left hover:border-red-500/50 transition-colors">
          <div className="bg-zinc-800 h-28 flex items-center justify-center text-5xl">🎷</div>
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-white font-semibold">Concert Jazz — Chorus</h3>
                <p className="text-zinc-400 text-xs">Ce soir 20h · Lausanne</p>
              </div>
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">25 CHF</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center text-xs">M</div>
              <span className="text-zinc-400 text-xs">Marc · <ScoreBadge score={96} /></span>
              <span className="text-zinc-600 text-xs ml-auto">1 place dispo</span>
            </div>
          </div>
        </button>
        {events.slice(1).map(e => (
          <div key={e.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="bg-zinc-800 h-20 flex items-center justify-center text-4xl">{e.photo}</div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-white font-semibold text-sm">{e.title}</h3>
                  <p className="text-zinc-400 text-xs">{e.time}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${e.price === 0 ? "bg-green-500/20 text-green-400" : "bg-red-500 text-white"}`}>
                  {e.price === 0 ? "Gratuit" : `${e.price} CHF`}
                </span>
              </div>
              <p className="text-zinc-500 text-xs">{e.seats} place{e.seats > 1 ? "s" : ""} · {e.host}</p>
            </div>
          </div>
        ))}
        <button className="w-full border border-dashed border-zinc-700 rounded-2xl p-4 text-center">
          <p className="text-red-400 font-semibold text-sm">+ Proposer un événement</p>
          <p className="text-zinc-600 text-xs mt-1">Concert, expo, activité... avec ou sans billet</p>
        </button>
      </div>
      <TabBar screen="events" go={go} />
    </div>
  );
}

function EventDetailScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <TopBar title="" back="events" go={go} />
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="bg-zinc-800 h-48 flex items-center justify-center text-7xl">🎷</div>
        <div className="px-5 pt-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Concert Jazz — Chorus</h2>
              <p className="text-zinc-400 text-sm">Ce soir 20h · Chorus Jazz Club</p>
              <p className="text-zinc-500 text-xs">Av. du Tribunal-Fédéral 1, Lausanne</p>
            </div>
            <span className="bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-lg">25 CHF</span>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center text-lg">🧑‍🦱</div>
            <div>
              <p className="text-white text-sm font-semibold">Marc propose 1 billet</p>
              <ScoreBadge score={96} />
            </div>
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed mb-6">
            J&apos;ai 2 billets mais mon ami ne peut plus venir. Super soirée jazz garantie ! Le groupe joue du jazz manouche, ambiance incroyable.
          </p>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-6">
            <p className="text-yellow-400 text-xs font-semibold mb-1">🔒 Paiement sécurisé</p>
            <p className="text-zinc-400 text-xs">25 CHF débités uniquement si Marc confirme. Remboursement automatique en cas de no-show.</p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-zinc-950 border-t border-zinc-800">
        <button onClick={() => go("inbox")} className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl text-lg">
          🎟️ Réserver pour 25 CHF
        </button>
      </div>
    </div>
  );
}

function MyProfileScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Mon profil</h1>
        <button className="text-zinc-400 text-sm">Modifier</button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-zinc-700 rounded-2xl flex items-center justify-center text-4xl">👩‍🦱</div>
          <div>
            <h2 className="text-white font-bold text-lg">Clara, 28</h2>
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-xs">✓ Vérifié</span>
              <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded-full">Basic</span>
            </div>
            <ScoreBadge score={98} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[{n:"12", l:"RDV"},{n:"0", l:"No-show"},{n:"98%", l:"Ponctualité"}].map(s => (
            <div key={s.l} className="bg-zinc-900 rounded-2xl p-3 text-center">
              <p className="text-white font-bold text-xl">{s.n}</p>
              <p className="text-zinc-500 text-xs">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="bg-zinc-900/50 border border-dashed border-zinc-700 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm font-semibold">RDV ce mois-ci</p>
            <p className="text-white font-bold">3 / 4 utilisés</p>
          </div>
          <button onClick={() => go("premium")} className="bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-xl">
            Premium
          </button>
        </div>
        <div className="space-y-2">
          {["Modifier mes photos", "Modifier ma bio", "Mes blocages", "Exporter mes données", "Supprimer mon compte"].map(item => (
            <button key={item} className="w-full bg-zinc-900 rounded-xl px-4 py-3 text-left text-zinc-300 text-sm flex items-center justify-between">
              {item} <span className="text-zinc-600">→</span>
            </button>
          ))}
        </div>
      </div>
      <TabBar screen="my-profile" go={go} />
    </div>
  );
}

function PremiumScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <TopBar title="Premium" back="discover" go={go} />
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⭐</div>
          <h2 className="text-2xl font-bold text-white">Clutch Premium</h2>
          <p className="text-zinc-400 text-sm mt-1">Pour les gens qui veulent vraiment se rencontrer</p>
        </div>
        <div className="space-y-3 mb-8">
          {[
            { icon: "∞", title: "RDV illimités", desc: "Plus de limite de 4/mois" },
            { icon: "🔔", title: "Alertes connexion", desc: "Notifié quand un profil qui t'intéresse est actif" },
            { icon: "👁️", title: "Qui a vu ton profil", desc: "Vois les profils qui t'ont consulté" },
            { icon: "🚀", title: "Appuyer une invitation", desc: "Mets en avant ton invitation — 2x plus de réponses" },
            { icon: "📊", title: "Tes stats", desc: "Taux d'acceptation, meilleur créneau horaire" },
            { icon: "✓", title: "Badge Premium visible", desc: "Signal de sérieux sur ton profil" },
          ].map(f => (
            <div key={f.title} className="bg-zinc-900 rounded-2xl p-4 flex gap-3">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-zinc-400 text-xs">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-zinc-900 rounded-2xl p-4 text-center mb-4">
          <p className="text-zinc-500 text-xs mb-1">Pour les femmes</p>
          <p className="text-green-400 font-bold">✓ Toujours 100% gratuit</p>
          <p className="text-zinc-500 text-xs mt-1">Toutes les fonctionnalités, sans limite</p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-zinc-950 border-t border-zinc-800">
        <button className="w-full bg-yellow-500 text-black font-bold py-4 rounded-2xl text-lg">
          19.90 CHF / mois
        </button>
        <p className="text-zinc-600 text-xs text-center mt-2">Sans engagement · Annulable à tout moment</p>
      </div>
    </div>
  );
}

function SOSScreen({ go }: { go: (s: Screen) => void }) {
  const [sent, setSent] = useState(false);
  return (
    <div className="flex flex-col h-full bg-red-950 items-center justify-center px-6 text-center">
      {!sent ? (
        <>
          <div className="text-6xl mb-4">🆘</div>
          <h2 className="text-2xl font-bold text-white mb-2">Bouton SOS</h2>
          <p className="text-red-200 text-sm mb-8 leading-relaxed">
            Ta position va être envoyée à ton contact de confiance avec le profil de la personne que tu rencontres.
          </p>
          <div className="bg-red-900/50 rounded-2xl p-4 w-full mb-6">
            <p className="text-red-300 text-xs mb-1">Contact de confiance</p>
            <p className="text-white font-semibold">+41 79 000 00 00</p>
          </div>
          <button onClick={() => setSent(true)} className="w-full bg-white text-red-600 font-bold py-4 rounded-2xl text-lg mb-4">
            🆘 Envoyer ma position
          </button>
          <button className="w-full bg-red-700 text-white font-semibold py-4 rounded-2xl mb-4">
            📞 Appeler le 117
          </button>
          <button onClick={() => go("discover")} className="text-red-300 text-sm underline">
            Annuler — tout va bien
          </button>
        </>
      ) : (
        <>
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">Position envoyée</h2>
          <p className="text-red-200 text-sm mb-8">Ton contact a été alerté avec ta position et le profil de la personne.</p>
          <button onClick={() => go("discover")} className="w-full bg-white text-red-600 font-bold py-4 rounded-2xl">
            Retour à l&apos;app
          </button>
        </>
      )}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function Demo() {
  const [screen, setScreen] = useState<Screen>("home");

  const screens: Record<Screen, React.ReactElement> = {
    home: <HomeScreen go={setScreen} />,
    onboarding1: <Onboarding1 go={setScreen} />,
    onboarding2: <Onboarding2 go={setScreen} />,
    onboarding3: <Onboarding3 go={setScreen} />,
    discover: <DiscoverScreen go={setScreen} />,
    profile: <ProfileScreen go={setScreen} />,
    propose: <ProposeScreen go={setScreen} />,
    propose2: <Propose2Screen go={setScreen} />,
    propose3: <Propose3Screen go={setScreen} />,
    inbox: <InboxScreen go={setScreen} />,
    "rdv-active": <RdvActiveScreen go={setScreen} />,
    checkin: <CheckinScreen go={setScreen} />,
    events: <EventsScreen go={setScreen} />,
    "event-detail": <EventDetailScreen go={setScreen} />,
    "my-profile": <MyProfileScreen go={setScreen} />,
    premium: <PremiumScreen go={setScreen} />,
    sos: <SOSScreen go={setScreen} />,
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Desktop wrapper */}
      <div className="hidden md:flex flex-col items-center gap-4">
        <p className="text-zinc-500 text-sm">Démo Clutch · <span className="text-red-400">{screen}</span></p>
        <div className="w-[390px] h-[844px] bg-black rounded-[54px] shadow-2xl overflow-hidden border-4 border-zinc-800 relative">
          {screens[screen]}
        </div>
        <div className="flex flex-wrap gap-2 max-w-lg justify-center">
          {(["home","discover","events","inbox","my-profile","premium","sos"] as Screen[]).map(s => (
            <button key={s} onClick={() => setScreen(s)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${screen === s ? "bg-red-500 border-red-500 text-white" : "border-zinc-700 text-zinc-400 hover:border-red-500"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      {/* Mobile — full screen */}
      <div className="md:hidden w-full h-screen fixed inset-0">
        {screens[screen]}
      </div>
    </div>
  );
}
