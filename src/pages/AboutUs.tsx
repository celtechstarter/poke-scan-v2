import { TeamMember } from '@/lib/types';
import { Github, Mail, Linkedin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const AboutUs = () => {
  // Daten für Teammitglieder
  const teamMembers: TeamMember[] = [
    {
      name: "Marcel Welk",
      role: "Full Stack Entwickler & Projektleiter",
      description: "Architektur, Frontend mit React, Backend mit Node.js, Texterkennung mit Tesseract.js und AWS-Integration.",
      image: "/lovable-uploads/c50fc555-0cf5-44b8-a017-e10bfd12252f.png",
      github: "https://github.com/celtechstarter",
      email: "mailto:marcel.welk87@gmail.com",
      linkedin: "https://linkedin.com",
    },
  ];

  // Trainer-Daten
  const trainers: TeamMember[] = [
    { 
      name: "Suheib Marzouka", 
      role: "Trainer", 
      description: "Trainer für PokeScan-Workshops.", 
      image: "/placeholder.svg" 
    },
    { 
      name: "Mete Adic", 
      role: "Trainer", 
      description: "Trainer für technische Schulungen.", 
      image: "/placeholder.svg" 
    },
    { 
      name: "Hubertus Knobling", 
      role: "Trainer", 
      description: "Unterstützung im praktischen Bereich.", 
      image: "/placeholder.svg" 
    },
  ];

  // Teaching Assist-Daten
  const teachingAssists: TeamMember[] = [
    { 
      name: "Sarah Borrell", 
      role: "Teaching Assist", 
      description: "Assistenz bei Schulungen und Workshops.", 
      image: "/placeholder.svg" 
    },
    { 
      name: "Marian Tugui", 
      role: "Teaching Assist", 
      description: "Betreuung und Nachbereitung von Inhalten.", 
      image: "/placeholder.svg" 
    },
  ];

  // Komponente zum Rendern von Karten
  const renderCard = (member: TeamMember) => (
    <Card key={member.name} className="overflow-hidden">
      <div className="flex flex-col items-center p-6">
        <Avatar className="w-24 h-24 mb-4">
          <AvatarImage src={member.image} alt={member.name} />
          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h3 className="text-xl font-bold">{member.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{member.role}</p>
        <p className="text-sm text-center mt-4">{member.description}</p>
        
        {(member.github || member.email || member.linkedin) && (
          <div className="flex mt-6 gap-2">
            {member.github && (
              <Button variant="outline" size="icon" asChild>
                <a href={member.github} target="_blank" rel="noopener noreferrer" aria-label={`GitHub von ${member.name}`}>
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            )}
            
            {member.email && (
              <Button variant="outline" size="icon" asChild>
                <a href={member.email} rel="noopener noreferrer" aria-label={`E-Mail an ${member.name}`}>
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
            )}
            
            {member.linkedin && (
              <Button variant="outline" size="icon" asChild>
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`LinkedIn von ${member.name}`}>
                  <Linkedin className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Titel und Beschreibung */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">PokeScan Technologies – Scan your Pokemon Cards</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          PokeScan nutzt modernste Technologien, um Pokémon-Karten mithilfe von Bildanalyse zu erkennen
          und deren Kartenpreise effizient darzustellen.
        </p>
      </div>

      {/* Team-Sektion */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Unser Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map(renderCard)}
        </div>
      </section>

      {/* Trainer-Sektion */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Unsere Trainer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trainers.map(renderCard)}
        </div>
      </section>

      {/* Teaching Assists-Sektion */}
      <section>
        <h2 className="text-2xl font-bold mb-8 text-center">Unsere Teaching Assists</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {teachingAssists.map(renderCard)}
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
