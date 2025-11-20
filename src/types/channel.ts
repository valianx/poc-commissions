export interface ChannelPSPAssignment {
  countryCode: string;
  pspId: string;
  isActive: boolean;
}

export interface Channel {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  pspAssignments: ChannelPSPAssignment[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PSP {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateChannelDto
  extends Omit<Channel, "id" | "createdAt" | "updatedAt" | "deletedAt"> {}

export interface UpdateChannelDto extends Partial<CreateChannelDto> {}

export interface CreatePSPDto
  extends Omit<PSP, "id" | "createdAt" | "updatedAt" | "deletedAt"> {}

export interface UpdatePSPDto extends Partial<CreatePSPDto> {}
