/**
 * ABFI Projects Layer Component
 * Displays bankability-assessed bioenergy projects on the map
 */

import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  User,
  FileText,
  Award,
  Target
} from 'lucide-react';

// Tier color scheme
const TIER_COLORS = {
  1: { bg: '#10B981', border: '#059669', text: '#064E3B' }, // Bankable - Green
  2: { bg: '#F59E0B', border: '#D97706', text: '#78350F' }, // Development Stage - Amber
  3: { bg: '#F97316', border: '#EA580C', text: '#9A3412' }, // High Risk - Orange
  4: { bg: '#EF4444', border: '#DC2626', text: '#991B1B' }, // Non-Investable - Red
};

// Status icons
const STATUS_ICONS = {
  OPERATIONAL: CheckCircle,
  UNDER_CONSTRUCTION: TrendingUp,
  FEED: Target,
  PRE_FEED: Clock,
  DEMONSTRATION: Award,
  PROPOSED: FileText,
  ON_HOLD: AlertTriangle,
  FAILED: XCircle,
};

// Tier labels
const TIER_LABELS = {
  1: 'Bankable',
  2: 'Development Stage',
  3: 'High Risk',
  4: 'Non-Investable',
};

interface ProjectsLayerProps {
  map: L.Map | null;
  visible: boolean;
  selectedTiers?: number[];
  onProjectSelect?: (project: any) => void;
}

export function ProjectsLayer({
  map,
  visible,
  selectedTiers = [1, 2, 3, 4],
  onProjectSelect
}: ProjectsLayerProps) {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [markers, setMarkers] = useState<L.Marker[]>([]);

  // Fetch projects data
  const { data: projectsData, isLoading } = trpc.abfiProjects.getAllAssessments.useQuery({
    limit: 100,
    tier: undefined, // We'll filter client-side
  });

  // Clear existing markers when component unmounts or visibility changes
  useEffect(() => {
    if (!map) return;
    return () => {
      markers.forEach(marker => map.removeLayer(marker));
    };
  }, [map, markers]);

  // Update markers when data changes
  useEffect(() => {
    if (!map || !visible || !projectsData?.assessments) return;

    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    const newMarkers: L.Marker[] = [];

    // Filter projects by selected tiers and valid coordinates
    const filteredProjects = projectsData.assessments.filter(project =>
      selectedTiers.includes(project.tier) &&
      project.latitude !== null &&
      project.longitude !== null &&
      typeof project.latitude === 'number' &&
      typeof project.longitude === 'number'
    );

    filteredProjects.forEach(project => {
      const tierColors = TIER_COLORS[project.tier as keyof typeof TIER_COLORS];
      const StatusIcon = STATUS_ICONS[project.status as keyof typeof STATUS_ICONS];

      // Create custom marker icon
      const markerIcon = L.divIcon({
        className: 'abfi-project-marker',
        html: `
          <div class="relative">
            <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center text-white font-bold text-xs"
                 style="background-color: ${tierColors.bg}; border-color: ${tierColors.border};">
              ${project.rank || '?'}
            </div>
            <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-white flex items-center justify-center"
                 style="background-color: ${tierColors.bg};">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
                ${StatusIcon === CheckCircle ? '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>' :
                  StatusIcon === TrendingUp ? '<path d="m13 2 3 3-3 3"/><path d="M3 12h4l3-3 4 14h4"/>' :
                  StatusIcon === Target ? '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>' :
                  StatusIcon === Clock ? '<circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>' :
                  StatusIcon === Award ? '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>' :
                  StatusIcon === FileText ? '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/>' :
                  StatusIcon === AlertTriangle ? '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' :
                  '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>'}
              </svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      // Create marker (coordinates are guaranteed to be numbers due to filter)
      const marker = L.marker([Number(project.latitude), Number(project.longitude)], {
        icon: markerIcon,
      });

      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.innerHTML = `
        <div class="p-3 max-w-sm">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center text-white font-bold text-sm"
                 style="background-color: ${tierColors.bg}; border-color: ${tierColors.border};">
              ${project.rank || '?'}
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-sm">${project.shortName || project.projectName}</h3>
              <p class="text-xs text-gray-600 mb-2">${project.technology} • ${project.state}</p>

              <div class="flex items-center gap-2 mb-2">
                <span class="px-2 py-1 rounded text-xs font-medium"
                      style="background-color: ${tierColors.bg}20; color: ${tierColors.text}; border: 1px solid ${tierColors.border}40;">
                  Tier ${project.tier}: ${TIER_LABELS[project.tier as keyof typeof TIER_LABELS]}
                </span>
              </div>

              <div class="flex items-center gap-2 text-xs text-gray-600 mb-2">
                <span>Score: ${project.overallScore}/10</span>
                <span>•</span>
                <span>Rating: ${project.rating}</span>
              </div>

              <div class="text-xs text-gray-600 mb-3">
                ${project.capacityValue} ${project.capacityUnit} • ${project.feedstock}
              </div>

              <button class="w-full px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors abfi-project-details-btn">
                View Details
              </button>
            </div>
          </div>
        </div>
      `;

      // Add click handler to the button
      const detailsButton = popupContent.querySelector('.abfi-project-details-btn');
      if (detailsButton) {
        detailsButton.addEventListener('click', () => {
          setSelectedProject(project);
          onProjectSelect?.(project);
          map.closePopup();
        });
      }

      // Bind popup to marker
      marker.bindPopup(popupContent);

      // Add to map
      marker.addTo(map);
      newMarkers.push(marker);
    });

    setMarkers(newMarkers);
  }, [map, projectsData, visible, selectedTiers, onProjectSelect]);

  // Don't render anything if not visible
  if (!visible) return null;

  return (
    <>
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">Loading projects...</span>
          </div>
        </div>
      )}

      {/* Project details modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full border-2 flex items-center justify-center text-white font-bold",
                    `bg-[${TIER_COLORS[selectedProject.tier as keyof typeof TIER_COLORS].bg}]`,
                    `border-[${TIER_COLORS[selectedProject.tier as keyof typeof TIER_COLORS].border}]`
                  )}>
                    {selectedProject.rank || '?'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedProject.projectName}</h2>
                    <p className="text-gray-600">{selectedProject.shortName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={cn(
                        `border-[${TIER_COLORS[selectedProject.tier as keyof typeof TIER_COLORS].border}]`,
                        `text-[${TIER_COLORS[selectedProject.tier as keyof typeof TIER_COLORS].text}]`
                      )}>
                        Tier {selectedProject.tier}: {TIER_LABELS[selectedProject.tier as keyof typeof TIER_LABELS]}
                      </Badge>
                      <Badge variant="secondary">
                        {selectedProject.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProject(null)}
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-2">Project Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Location:</strong> {selectedProject.siteLocation}, {selectedProject.state}</div>
                    <div><strong>Technology:</strong> {selectedProject.technology}</div>
                    <div><strong>Feedstock:</strong> {selectedProject.feedstock}</div>
                    <div><strong>Capacity:</strong> {selectedProject.capacityValue} {selectedProject.capacityUnit}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">ABFI Assessment</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Overall Score:</strong> {selectedProject.overallScore}/10</div>
                    <div><strong>Rating:</strong> {selectedProject.rating}</div>
                    <div><strong>Ranking:</strong> #{selectedProject.rank} of {projectsData?.totalCount || '?'}</div>
                  </div>
                </div>
              </div>

              {/* Key Strengths */}
              {selectedProject.keyStrengths && selectedProject.keyStrengths.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Key Strengths
                  </h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {selectedProject.keyStrengths.map((strength: string, index: number) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Risks */}
              {selectedProject.keyRisks && selectedProject.keyRisks.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    Key Risks
                  </h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {selectedProject.keyRisks.map((risk: string, index: number) => (
                      <li key={index}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Critical Issues */}
              {selectedProject.criticalIssues && selectedProject.criticalIssues.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    Critical Issues
                  </h3>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {selectedProject.criticalIssues.map((issue: string, index: number) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedProject(null)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button className="flex-1">
                  <User className="w-4 h-4 mr-2" />
                  Claim Project
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <h4 className="font-semibold mb-3">ABFI Project Rankings</h4>

        <div className="space-y-2">
          {Object.entries(TIER_LABELS).map(([tier, label]) => {
            const tierNum = parseInt(tier);
            const colors = TIER_COLORS[tierNum as keyof typeof TIER_COLORS];
            const isSelected = selectedTiers.includes(tierNum);

            return (
              <div key={tier} className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border-2",
                    isSelected ? "opacity-100" : "opacity-30"
                  )}
                  style={{
                    backgroundColor: isSelected ? colors.bg : '#E5E7EB',
                    borderColor: isSelected ? colors.border : '#9CA3AF'
                  }}
                />
                <span className={cn(
                  "text-sm",
                  isSelected ? "text-gray-900" : "text-gray-400"
                )}>
                  Tier {tier}: {label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t text-xs text-gray-600">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span>Numbers = National ranking</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-gray-400 rounded-full"></div>
            <span>Icons = Project status</span>
          </div>
        </div>
      </div>
    </>
  );
}

// Add CSS for marker animations
const markerStyles = `
  .abfi-project-marker {
    transition: transform 0.2s ease;
  }

  .abfi-project-marker:hover {
    transform: scale(1.1);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = markerStyles;
  document.head.appendChild(styleSheet);
}