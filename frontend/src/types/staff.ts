/**
 * Staff Management Types
 */

export interface StaffInviteRequest {
    email: string;
}

export interface StaffInviteResponse {
    status: string;
    message: string;
    invitationId: string;
    recipientEmail: string;
    expiresAt: string;
}

export interface InvitationStatusResponse {
    valid: boolean;
    expired: boolean;
    recipientEmail?: string;
    inviterName?: string;
    clinicName?: string;
    message: string;
}

export interface AcceptInviteRequest {
    password: string;
    confirmPassword: string;
}

export interface AcceptInviteResponse {
    status: string;
    message: string;
    userId: string;
    accessToken: string;
    refreshToken: string;
    tokenType: string;
}

export interface StaffMember {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    invitedById?: string;
}

export interface PendingInvitation {
    id: string;
    recipientEmail: string;
    createdAt: string;
    expiresAt: string;
    expired: boolean;
}
