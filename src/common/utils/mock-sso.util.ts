import { SsoAuthData } from 'src/auth/interfaces/sso-response.interface';

export class MockSsoUtil {
  /**
   * สร้างข้อมูล Mock สำหรับการ Login/Verify SSO
   */
  static getMockSsoData(username: string, token: string = 'mock_token_12345'): SsoAuthData {
    return {
      userid: '1978904', // sso_userid ของ user_id = 1
      username: username || 'eform01',
      token: token || '05c6e25e78194e3683da1de4bf779264',
      idcard_no: 'N07658967-455',
      email: 'eform01@mail.com',
      prefix_name: '',
      firstname: 'ทดสอบ01',
      lastname: 'ทดสอบ',
      work_position_text: '',
      work_place_text: '',
      work_place_id: '0',
      work_place_name: 'หน่วยงาน สส.',
      work_place_type_id: '0',
      work_place_type_name: 'หน่วยงาน สส.',
      division_id: '101',
      division_name: 'กรมการเปลี่ยนแปลงสภาพภูมิอากาศและสิ่งแวดล้อม',
      sub_division_id: '114',
      sub_division_name: 'ผู้ใช้งาน e-form',
    };
  }
}
