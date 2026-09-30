import { create } from 'zustand';
import type {
  EventData,
  FieldType,
  NameStyle,
  PhotoShape,
} from '@/types/campaign-builder';
import { DEFAULT_NAME_STYLE } from '@/types/campaign-builder';

interface CampaignBuilderState {
  event: EventData | null;
  title: string;
  description: string;
  designFile: File | null;
  designUrl: string;
  originalWidth: number;
  originalHeight: number;
  editorWidth: number;
  editorHeight: number;
  zoom: number;
  selectedField: FieldType | null;
  nameStyle: NameStyle;
  photoShape: PhotoShape;
  saving: boolean;
  loading: boolean;
  error: string;

  setEvent: (event: EventData | null) => void;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setDesignFile: (file: File | null) => void;
  setDesignUrl: (url: string) => void;
  setOriginalWidth: (width: number) => void;
  setOriginalHeight: (height: number) => void;
  setEditorWidth: (width: number) => void;
  setEditorHeight: (height: number) => void;
  setZoom: (zoom: number) => void;
  setSelectedField: (field: FieldType | null) => void;
  setNameStyle: (style: NameStyle) => void;
  updateNameStyle: (updates: Partial<NameStyle>) => void;
  setPhotoShape: (shape: PhotoShape) => void;
  setSaving: (saving: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
}

export const useCampaignBuilderStore = create<CampaignBuilderState>((set) => ({
  event: null,
  title: '',
  description: '',
  designFile: null,
  designUrl: '',
  originalWidth: 1080,
  originalHeight: 1080,
  editorWidth: 700,
  editorHeight: 700,
  zoom: 1,
  selectedField: null,
  nameStyle: DEFAULT_NAME_STYLE,
  photoShape: 'rectangle',
  saving: false,
  loading: true,
  error: '',

  setEvent: (event) => set({ event }),
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setDesignFile: (designFile) => set({ designFile }),
  setDesignUrl: (designUrl) => set({ designUrl }),
  setOriginalWidth: (originalWidth) => set({ originalWidth }),
  setOriginalHeight: (originalHeight) => set({ originalHeight }),
  setEditorWidth: (editorWidth) => set({ editorWidth }),
  setEditorHeight: (editorHeight) => set({ editorHeight }),
  setZoom: (zoom) => set({ zoom }),
  setSelectedField: (selectedField) => set({ selectedField }),
  setNameStyle: (nameStyle) => set({ nameStyle }),
  updateNameStyle: (updates) =>
    set((state) => ({ nameStyle: { ...state.nameStyle, ...updates } })),
  setPhotoShape: (photoShape) => set({ photoShape }),
  setSaving: (saving) => set({ saving }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
