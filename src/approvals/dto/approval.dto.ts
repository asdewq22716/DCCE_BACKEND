export class CreateApprovalDto {
  ref_table: string;
  ref_id: string;
  title: string;
  payload?: any;
  required_role?: string;
  required_user_id?: string;
  max_level?: number;
  requester_id?: string;
}

export class ActionApprovalDto {
  action: 'approved' | 'rejected';
  comment?: string;
}
