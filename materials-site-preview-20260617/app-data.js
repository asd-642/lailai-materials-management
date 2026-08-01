const DEMO_EMAIL = "123";
const STAFF_EMAIL = "456";
const DEMO_PASSWORD_HASH = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3";
const STAFF_PASSWORD_HASH = "b3a8e0e1f9ab1bfe3a36f231f676f78bb30a519d2b21e6c530c0eee8ebb4a5d0";
const STORAGE_KEY = "materials_quote_clone_state";
const AUTH_KEY = "materials_quote_clone_auth";
const AUTH_USER_KEY = "materials_quote_clone_auth_user";
const ACCOUNTS_KEY = "materials_quote_clone_accounts";
const WORK_LOGS_KEY = "materials_quote_work_logs";
const LOGIN_ATTEMPTS_KEY = "materials_quote_login_attempts";
const QUOTE_DRAFT_KEY = "materials_quote_autosave_draft";
const DATA_SCHEMA_VERSION = 3;
const WORK_LOG_LIMIT = 500;

const ACCOUNT_ROLE_LABELS = {
  owner: "\u8001\u95c6",
  admin: "管理人員",
  staff: "一般人員",
};

const ACCOUNT_ROLES = Object.freeze(["owner", "admin", "staff", "contractor"]);
ACCOUNT_ROLE_LABELS.contractor = "\u5916\u5305\u4eba\u54e1";

const ACCOUNT_PERMISSION_GROUPS = [
  {
    title: "系統管理",
    permissions: [
      {
        key: "manage_accounts",
        title: "管理員工帳號",
        description: "允許新增員工帳號、修改員工資料，以及調整每個帳號的權限。",
        adminDefault: true,
        staffDefault: false,
      },
      {
        key: "edit_company_settings",
        title: "修改公司設定",
        description: "允許修改公司資料、報價單抬頭、條款、印章與 QR Code 等設定。",
        adminDefault: true,
        staffDefault: false,
      },
    ],
  },
  {
    title: "資料與價格",
    permissions: [
      {
        key: "edit_material_prices",
        title: "修改材料庫與價格",
        description: "允許新增或編輯材料、工錢、成本、耗損與計價方式。",
        adminDefault: true,
        staffDefault: false,
      },
      {
        key: "edit_quote_templates",
        title: "修改報價單版本",
        description: "允許新增或編輯報價單版本、注意事項、付款條件、保固與工錢細項。",
        adminDefault: true,
        staffDefault: false,
      },
      {
        key: "delete_user_data",
        title: "刪除用戶數據",
        description: "允許刪除系統內的資料。這是總開關，權限較高，請只開給可信任人員。",
        adminDefault: true,
        staffDefault: false,
      },
      {
        key: "delete_customers",
        title: "刪除客戶資料",
        description: "允許刪除客戶檔案與客戶聯絡資料。",
        adminDefault: true,
        staffDefault: false,
      },
      {
        key: "delete_quotes",
        title: "刪除報價單",
        description: "允許刪除已建立的報價單。",
        adminDefault: true,
        staffDefault: false,
      },
    ],
  },
  {
    title: "日常工具",
    permissions: [
      {
        key: "approve_quotes",
        title: "核准並寄出報價",
        description: "允許核准待核准報價並鎖定文件快照。",
        adminDefault: true,
        staffDefault: false,
      },
      {
        key: "use_customer_ocr",
        title: "使用 OCR 匯入客戶",
        description: "允許在新增客戶時使用名片 OCR，把辨識到的資料填入客戶表單。",
        adminDefault: true,
        staffDefault: true,
      },
    ],
  },
];

const ACCOUNT_PERMISSION_DEFINITIONS = ACCOUNT_PERMISSION_GROUPS.flatMap((group) => group.permissions);

const PRICING_TYPE_OPTIONS = [
  {
    value: "wood_board_tsai",
    label: "板才 (板材)",
    short: "板才 (板材)",
    hint: "才 = 厚 × 寬 × 長 / 板才基數。Excel 1150709 版使用 2781，既有 legacy-v1 使用 2782。",
    needs: { thickness: true, width: true, length: true },
  },
  {
    value: "steel_rect_tube",
    label: "方管 / 角管 (重量計價)",
    short: "方管 / 角管 (重量)",
    hint: "依管材幾何算重量(kg)再×單價。高度、寬度輸入 cm，壁厚輸入 mm。",
    needs: { thickness: true, width: true, length: true },
    dimLabels: { thickness: "高度", width: "寬度", length: "長度" },
    needsWall: true,
    needsFactor: true,
  },
  {
    value: "single",
    label: "單一計價",
    short: "單一計價",
    hint: "總價 = 單價 × 數量 (例:磁磚每片、五金每組)",
    needs: { thickness: false, width: false, length: false },
  },
  {
    value: "by_length",
    label: "長度計價",
    short: "長度計價",
    hint: "總價 = 單價 × (長 × 數量)，例:踢腳板每公尺",
    needs: { thickness: false, width: false, length: true },
  },
  {
    value: "by_area",
    label: "面積計價 (平方公尺)",
    short: "面積計價",
    hint: "總價 = 單價 × (寬 × 長 × 數量)，例:壁紙每平米",
    needs: { thickness: false, width: true, length: true },
  },
  {
    value: "by_volume",
    label: "體積計價",
    short: "體積計價",
    hint: "總價 = 單價 × (厚 × 寬 × 長 × 數量)",
    needs: { thickness: true, width: true, length: true },
  },
  {
    value: "wood_tsai",
    label: "立才 (角材)",
    short: "立才 (角材)",
    hint: "才 = 厚寸 × 寬寸 × 長尺。用於 4寸角這類角材。",
    needs: { thickness: true, width: true, length: true },
  },
  {
    value: "steel_round_tube",
    label: "圓管 (重量計價)",
    short: "圓管 (重量)",
    hint: "依外徑與壁厚算重量(kg)再×單價。外徑輸入 cm，壁厚輸入 mm。",
    needs: { thickness: false, width: true, length: true },
    dimLabels: { width: "外徑", length: "長度" },
    needsWall: true,
    needsFactor: true,
  },
];

const QUOTE_STATUS_LABEL = {
  draft: "草稿",
  pending_approval: "待核准",
  approved: "已核准",
  returned: "已退回",
  sent: "已寄出",
  won: "成交",
  lost: "未成交",
  expired: "已過期",
};

const QUOTE_LOCKED_STATUSES = ["approved", "sent", "won", "lost", "expired"];

const DEFAULT_TERMS = `＊付款方式(匯款)：第一銀行 內壢分行 帳號:280-10-830821 戶名:來來建材有限公司
＊本報價單(不含檢驗費)、運費以（拖車能到達之下貨地點，堆高機30公尺範圍以內為準），超出此範圍之費用，另行報價。
＊本報價單７日內有效，經雙方簽名(蓋章)並回傳確認，即為正式訂購交易，買賣行為即成立。
＊交貨期限：完成買賣程序與訂金付訖後起算60天，經買方通知後，雙方約定進場日期。
＊非現貨之下單生產訂製品，單一規格與單一顏色下單總重量需達一噸重，如不足需分別額外加收上機費。
*送審提供我司既有測試報告，如需額外加測，測試費用另計
＊客戶付清全部款項後，始得請求本公司開立出廠證明及保固書(保固期間：完工日算起1年內)。
＊本交易為附條件買賣，依動產擔保交易法第三章之規定，在貨款未付清或票據未兌現償付之前，標的物之所有權人歸屬本公司所有。
＊本契約之解釋、效力及其他未盡事宜，皆以相關法律為準則。倘有任何糾紛，雙方同意以桃園地方法院為第一審管轄法院。`;

const defaultLaborItems = () => [
  { name: "零星工料", unit: "式", pct: 3.8, unit_price: "", manual_amount: "", is_balancer: false },
  { name: "五金零件", unit: "式", pct: 4.5, unit_price: "", manual_amount: "", is_balancer: false },
  { name: "工地小搬運", unit: "式", pct: 2.2, unit_price: "", manual_amount: "", is_balancer: false },
  { name: "運費", unit: "式", pct: 3.5, unit_price: "", manual_amount: "", is_balancer: false },
  { name: "木工工資", unit: "式", pct: "", unit_price: "", manual_amount: "", is_balancer: true },
];

const seedData = () => ({
  meta: { schema_version: 0 },
  company: {
    name: "來來建材有限公司",
    englishName: "",
    taxId: "",
    defaultTaxRate: 5,
    email: "",
    phone: "(03)2750188",
    fax: "(03)4911768",
    address: "桃園市中壢區中央西路二段30號13樓",
    managerName: "",
    preparerName: "辜莉珧",
    formCode: "",
    bankInfo: "第一銀行 內壢分行 帳號:280-10-830821 戶名:來來建材有限公司",
    defaultTerms: DEFAULT_TERMS,
  },
  materials: [
    {
      id: "m1",
      name: "不銹鋼管",
      code: "29875980",
      category: "鋼構",
      unit: "KG",
      pricing_type: "steel_rect_tube",
      formula_version: "excel-1150709-v1",
      default_thickness: 3.8,
      default_width: 3.8,
      default_length: "",
      default_weight: "",
      wall_thickness_mm: 2,
      density_factor: 0.02466,
      cost_price: "",
      cost_price_status: "unverified",
      price_effective_date: "2026-07-09",
      unit_price: 180,
      waste_pct: 0,
      labor_unit_price: 140,
      labor_waste_pct: 5,
      labor_pricing_type: "wood_board_tsai",
      notes: "",
      is_active: true,
    },
    {
      id: "m2",
      name: "不鏽鋼扣件",
      code: "7489173498213",
      category: "其他配件",
      unit: "個",
      pricing_type: "single",
      formula_version: "excel-1150709-v1",
      default_thickness: "",
      default_width: "",
      default_length: "",
      default_weight: "",
      wall_thickness_mm: "",
      density_factor: 0.02466,
      cost_price: "",
      cost_price_status: "unverified",
      price_effective_date: "2026-07-09",
      unit_price: 15,
      waste_pct: 0,
      labor_unit_price: 0,
      labor_waste_pct: "",
      labor_pricing_type: "",
      notes: "",
      is_active: true,
    },
    {
      id: "m3",
      name: "不鏽鋼角鐵",
      code: "173948",
      category: "其他配件",
      unit: "個",
      pricing_type: "single",
      formula_version: "excel-1150709-v1",
      default_thickness: "",
      default_width: "",
      default_length: "",
      default_weight: "",
      wall_thickness_mm: "",
      density_factor: 0.02466,
      cost_price: "",
      cost_price_status: "unverified",
      price_effective_date: "2026-07-09",
      unit_price: 50,
      waste_pct: 0,
      labor_unit_price: 0,
      labor_waste_pct: "",
      labor_pricing_type: "",
      notes: "",
      is_active: true,
    },
    {
      id: "m4",
      name: "塑木(中空)-一代",
      code: "ZY-D-038 (刀刻痕)",
      category: "塑木",
      unit: "才",
      pricing_type: "wood_board_tsai",
      formula_version: "excel-1150709-v1",
      default_thickness: 2.5,
      default_width: 14.6,
      default_length: 100,
      default_weight: "",
      wall_thickness_mm: "",
      density_factor: 0.02466,
      cost_price: "",
      cost_price_status: "unverified",
      price_effective_date: "2026-07-09",
      unit_price: 350,
      waste_pct: 5,
      labor_unit_price: 140,
      labor_waste_pct: 5,
      labor_pricing_type: "",
      notes: "",
      is_active: true,
    },
  ],
  customers: [
    {
      id: "c1",
      name: "內湖辦公室",
      phone: "02-26271939",
      address: "內湖洲子街88號",
      company_name: "智林國際股份有限公司",
      tax_id: "42995649",
      invoice_title: "智林國際股份有限公司",
      contacts: [
        {
          name: "王冠元",
          role: "業務",
          phone: "0972798321",
          email: "oscar@azio1.com",
          notes: "",
          primary: true,
        },
      ],
      notes: "",
      is_active: true,
    },
  ],
  templates: [
    {
      id: "t1",
      name: "公版",
      description: "2026版",
      notes: DEFAULT_TERMS,
      warranty: "",
      payments: [
        { pct: 50, text: "訂約金請於簽約時支付現金" },
        { pct: 50, text: "完工款請於完工三日內支付現金" },
        { pct: "", text: "(完工後一個月若無缺失改善要求視同驗收合格)" },
      ],
      laborItems: defaultLaborItems(),
      is_default: true,
      is_active: true,
    },
  ],
  quotes: [
    {
      id: "q1",
      quote_no: "Q-20260601-001",
      customer_id: "c1",
      template_id: "t1",
      title: "",
      project_name: "",
      quote_date: "2026-06-01",
      valid_until: "",
      status: "draft",
      discount_amount: 5000,
      tax_rate: 5,
      extra_notes: "",
      sections: [
        {
          name: "公園地板",
          area_qty: 2,
          unit: "M²",
          spec: "",
          items: [
            itemFromMaterial("m4", { quantity: 20 }),
            itemFromMaterial("m3", { quantity: 10 }),
          ],
          laborItems: defaultLaborItems(),
        },
        {
          name: "公園涼亭",
          area_qty: 5,
          unit: "M²",
          spec: "",
          items: [itemFromMaterial("m4", { quantity: 111 })],
          laborItems: defaultLaborItems(),
        },
      ],
      manualTotal: 296858,
    },
    {
      id: "q2",
      quote_no: "Q-20260528-001",
      customer_id: "c1",
      template_id: "t1",
      title: "天花板",
      project_name: "內湖辦公室",
      quote_date: "2026-05-28",
      valid_until: "",
      status: "draft",
      discount_amount: 0,
      tax_rate: 5,
      extra_notes: "",
      sections: [
        {
          name: "內湖辦公室",
          area_qty: 18,
          unit: "M²",
          spec: "面板:塑木中空2.5*14.6cm 7號色 / 底樑:不鏽鋼",
          items: [itemFromMaterial("m4", { quantity: 210 })],
          laborItems: defaultLaborItems(),
        },
      ],
      manualTotal: 966988,
    },
  ],
});
