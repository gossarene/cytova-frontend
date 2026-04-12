import { useSearchParams } from 'react-router-dom'
import {
  Layers, Network, TestTube, FlaskConical, Droplet, ClipboardList,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared/PageHeader'
import { ExamDefinitionsPanel } from '../components/panels/ExamDefinitionsPanel'
import { FamiliesPanel } from '../components/panels/FamiliesPanel'
import { SubFamiliesPanel } from '../components/panels/SubFamiliesPanel'
import { TubeTypesPanel } from '../components/panels/TubeTypesPanel'
import { TechniquesPanel } from '../components/panels/TechniquesPanel'
import { SampleTypesPanel } from '../components/panels/SampleTypesPanel'

/**
 * Unified Catalog page.
 *
 * Hosts every catalog-scoped area inside a single page with internal tabs:
 *
 *   - Exam Definitions (default)
 *   - Families
 *   - Sub-families
 *   - Tube Types
 *   - Techniques
 *   - Sample Types
 *
 * Reference-data management is deliberately kept inside /catalog rather than
 * promoted to a main-sidebar entry — these are configuration entities, not
 * workflow screens. The active tab is mirrored in the URL as ``?tab=<key>``
 * so bookmarks and "open in new tab" both land on the expected section.
 *
 * Write actions inside every panel are gated by ``P.CATALOG_MANAGE``; read
 * paths require only ``P.CATALOG_VIEW`` (enforced by the router guard).
 */

const TAB_KEYS = [
  'exams',
  'families',
  'sub-families',
  'tube-types',
  'techniques',
  'sample-types',
] as const

type TabKey = typeof TAB_KEYS[number]

const DEFAULT_TAB: TabKey = 'exams'

function isTabKey(value: string | null): value is TabKey {
  return value !== null && (TAB_KEYS as readonly string[]).includes(value)
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('tab')
  const activeTab: TabKey = isTabKey(raw) ? raw : DEFAULT_TAB

  function handleTabChange(next: string) {
    const nextParams = new URLSearchParams(searchParams)
    if (next === DEFAULT_TAB) {
      nextParams.delete('tab')
    } else {
      nextParams.set('tab', next)
    }
    setSearchParams(nextParams, { replace: true })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalog"
        description="Exam definitions and the structured reference data that backs them."
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="exams" className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" /> Exam definitions
          </TabsTrigger>
          <TabsTrigger value="families" className="gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Families
          </TabsTrigger>
          <TabsTrigger value="sub-families" className="gap-1.5">
            <Network className="h-3.5 w-3.5" /> Sub-families
          </TabsTrigger>
          <TabsTrigger value="tube-types" className="gap-1.5">
            <TestTube className="h-3.5 w-3.5" /> Tube types
          </TabsTrigger>
          <TabsTrigger value="techniques" className="gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" /> Techniques
          </TabsTrigger>
          <TabsTrigger value="sample-types" className="gap-1.5">
            <Droplet className="h-3.5 w-3.5" /> Sample types
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="mt-6">
          <ExamDefinitionsPanel />
        </TabsContent>
        <TabsContent value="families" className="mt-6">
          <FamiliesPanel />
        </TabsContent>
        <TabsContent value="sub-families" className="mt-6">
          <SubFamiliesPanel />
        </TabsContent>
        <TabsContent value="tube-types" className="mt-6">
          <TubeTypesPanel />
        </TabsContent>
        <TabsContent value="techniques" className="mt-6">
          <TechniquesPanel />
        </TabsContent>
        <TabsContent value="sample-types" className="mt-6">
          <SampleTypesPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
