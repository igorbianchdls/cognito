'use client';

import CardsGlassmorphism from '@/components/test/analysis-planning/CardsGlassmorphism';
import CardsNeon from '@/components/test/analysis-planning/CardsNeon';
import CardsMaterial from '@/components/test/analysis-planning/CardsMaterial';
import CardsMinimal from '@/components/test/analysis-planning/CardsMinimal';
import ChecklistNotion from '@/components/test/analysis-planning/ChecklistNotion';
import ChecklistTerminal from '@/components/test/analysis-planning/ChecklistTerminal';
import ChecklistJira from '@/components/test/analysis-planning/ChecklistJira';
import ChecklistCookbook from '@/components/test/analysis-planning/ChecklistCookbook';

export default function BigQueryTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          🧪 Teste de UI: Analysis Planning Components
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cards Section */}
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
              🎴 Cards Compactos
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3">2A. Glassmorphism</h3>
                <CardsGlassmorphism />
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3">2B. Neon/Cyber</h3>
                <CardsNeon />
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3">2C. Material Design</h3>
                <CardsMaterial />
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3">2D. Minimalista</h3>
                <CardsMinimal />
              </div>
            </div>
          </div>

          {/* Checklist Section */}
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
              📝 Checklist Elegante
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3">3A. Notion-like</h3>
                <ChecklistNotion />
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3">3B. Terminal/CLI</h3>
                <ChecklistTerminal />
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3">3C. Jira/Agile</h3>
                <ChecklistJira />
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3">3D. Cookbook/Recipe</h3>
                <ChecklistCookbook />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}