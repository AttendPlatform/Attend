import type { FabricObject } from "fabric";

export type FieldType = "photo" | "name";
export type PhotoShape = "rectangle" | "circle";

export type FieldData = {
  type: FieldType;
  shape?: PhotoShape;
};

export type FieldObject = FabricObject & {
  data?: FieldData;
};

export type EventData = {
  id: string;
  title: string;
  cover_image: string | null;
};

export type CampaignBuilderCampaign = {
  id: string;
  event_id: string;
  creator_id: string;
  title: string;
  slug: string;
  description: string | null;
  status?: string;
};

export type CampaignBuilderTemplate = {
  id: string;
  campaign_id: string;
  name: string;
  asset_url: string;
  width: number;
  height: number;
  canvas_config: any;
  version: number;
  is_active: boolean;
};

export type CampaignBuilderProps = {
  mode: "create" | "edit";
  eventId: string;
  campaign?: CampaignBuilderCampaign;
  template?: CampaignBuilderTemplate;
};

export type NameStyle = {
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  textAlign: "left" | "center" | "right";
};

export const DEFAULT_NAME_STYLE: NameStyle = {
  fontFamily: "Arial",
  fontSize: 32,
  color: "#111111",
  bold: true,
  textAlign: "center",
};

export const FONT_OPTIONS = [
  "Arial",
  "Helvetica",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Trebuchet MS",
];
