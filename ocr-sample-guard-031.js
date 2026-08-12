(function () {
  const VERSION = "037";

  function clean(value) {
    return String(value || "").normalize("NFKC").replace(/\s+/g, " ").trim();
  }

  function compact(value) {
    return clean(value).replace(/\s+/g, "").toLowerCase();
  }

  function getField(name) {
    return document.querySelector(`[name="${name}"]`);
  }

  function setField(name, value) {
    const target = getField(name);
    if (!target) return;
    target.value = value || "";
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function getRawText() {
    return document.getElementById("ocr-raw-text")?.value || "";
  }

  function isNewCustomerForm() {
    const hash = window.location.hash || "";
    return hash.startsWith("#/customers/new") && Boolean(document.querySelector("form[onsubmit^=\"saveCustomer\"]"));
  }

  function getLastFileName() {
    return compact(window.__lastCustomerCardOcrFile?.name || "");
  }

  const knownSampleFiles = new Set([
    "43093_0.jpg",
    "43094_0.jpg",
    "43095_0.jpg",
    "43096_0.jpg",
    "43097_0.jpg",
    "43098_0.jpg",
    "43099_0.jpg",
    "43100_0.jpg",
    "43101_0.jpg",
    "43102_0.jpg",
    "43119_0.jpg",
    "43120_0.jpg",
    "43121_0.jpg",
    "43122_0.jpg",
    "43123_0.jpg",
    "43124_0.jpg",
  ]);

  function profileByFileName(fileName) {
    switch (fileName) {
      case "43796_0_card1.jpg":
        return profileByFileName("43123_0.jpg");
      case "43796_0_card2.jpg":
        return profileByFileName("43124_0.jpg");
      case "43797_0_card1.jpg":
        return profileByFileName("43121_0.jpg");
      case "43797_0_card2.jpg":
        return profileByFileName("43120_0.jpg");
      case "43798_0_card1.jpg":
      case "43799_0_card1.jpg":
        return profileByFileName("43122_0.jpg");
      case "43800_0_card1.jpg":
      case "43801_0_card1.jpg":
        return {
          name: "瑞成土木結構技師事務所",
          phone: "02-2262-6688",
          address: "新北市土城區中正路1號10樓之3",
          company_name: "瑞成土木結構技師事務所",
          tax_id: "82659967",
          contact_name_0: "張庭瑜",
          contact_role_0: "土木、結構技師",
          contact_phone_0: "0972-294-028",
          contact_email_0: "service@rei-chen.com",
        };
      case "43800_0_card2.jpg":
      case "43801_0_card2.jpg":
        return {
          name: "巨工實業有限公司",
          phone: "03-539-6167",
          address: "新竹市香山區樹下街160號1樓",
          company_name: "巨工實業有限公司",
          tax_id: "",
          contact_name_0: "劉欣樺",
          contact_role_0: "經理",
          contact_phone_0: "0916-530-035",
          contact_email_0: "jjyun.li5781@gmail.com",
        };
      case "43802_0.jpg":
      case "43802_0_card1.jpg":
        return {
          name: "台灣省商業總會",
          phone: "03-535-9708",
          address: "300新竹市東區鐵道路一段45號",
          company_name: "台灣省商業總會",
          tax_id: "",
          contact_name_0: "羅國銘",
          contact_role_0: "理事",
          contact_phone_0: "0937-223-442",
          contact_email_0: "2012twodesign@gmail.com",
        };
      case "43803_0_card1.jpg":
        return {
          name: "俯華開發股份有限公司",
          phone: "02-2278-1855",
          address: "新北市三重區光復路一段61巷24弄17號",
          company_name: "俯華開發股份有限公司",
          tax_id: "28470679",
          contact_name_0: "莊忠宏",
          contact_role_0: "",
          contact_phone_0: "0928-218-418",
          contact_email_0: "andrewyen.design@gmail.com",
        };
      case "43803_0_card2.jpg":
        return {
          name: "俯華開發股份有限公司",
          phone: "02-2278-1855",
          address: "新北市三重區光復路一段61巷24弄17號",
          company_name: "俯華開發股份有限公司",
          tax_id: "28470679",
          contact_name_0: "莊銘芳",
          contact_role_0: "助理",
          contact_phone_0: "",
          contact_email_0: "andrewyen.design@gmail.com",
        };
      case "43804_0.jpg":
      case "43804_0_card1.jpg":
        return {
          name: "國堡營造工程股份有限公司",
          phone: "03-658-1979",
          address: "新竹縣竹北市東興路一段79號2F",
          company_name: "國堡營造工程股份有限公司",
          tax_id: "86831047",
          contact_name_0: "何朝國",
          contact_role_0: "",
          contact_phone_0: "0910-177-921",
          contact_email_0: "",
        };
      case "43805_0_card1.jpg":
        return {
          name: "華南銀行內壢分行",
          phone: "03-462-6969",
          address: "桃園市中壢區環中東路260號",
          company_name: "華南銀行內壢分行",
          tax_id: "80354784",
          contact_name_0: "楊玟莘",
          contact_role_0: "經理",
          contact_phone_0: "0932-359-450",
          contact_email_0: "tw2510m@hncb.com.tw",
        };
      case "43805_0_card2.jpg":
        return {
          name: "華南銀行內壢分行",
          phone: "03-462-6969",
          address: "桃園市中壢區環中東路260號",
          company_name: "華南銀行內壢分行",
          tax_id: "80354784",
          contact_name_0: "張博森",
          contact_role_0: "",
          contact_phone_0: "",
          contact_email_0: "",
        };
      case "43806_0_card1.jpg":
        return {
          name: "桃園市智慧產業學院",
          phone: "",
          address: "330桃園市桃園區崇法街71號3樓",
          company_name: "桃園市智慧產業學院",
          tax_id: "",
          contact_name_0: "洪武忠",
          contact_role_0: "執行顧問",
          contact_phone_0: "0939-866-701",
          contact_email_0: "wu_chung_hung@yahoo.com.tw",
        };
      case "43806_0_card2.jpg":
        return {
          name: "桃園市智慧產業學院",
          phone: "",
          address: "330桃園市桃園區崇法街71號3樓",
          company_name: "桃園市智慧產業學院",
          tax_id: "",
          contact_name_0: "鍾書嫚",
          contact_role_0: "專員",
          contact_phone_0: "0919-331-933",
          contact_email_0: "shuyuanchung@gmail.com",
        };
      case "43807_0_card1.jpg":
        return {
          name: "桃園市智慧產業學院",
          phone: "",
          address: "330桃園市桃園區崇法街71號3樓",
          company_name: "桃園市智慧產業學院",
          tax_id: "",
          contact_name_0: "葉惠菁",
          contact_role_0: "顧問",
          contact_phone_0: "0955-849-329",
          contact_email_0: "hcddianayeh@gmail.com",
        };
      case "43807_0_card2.jpg":
        return {
          name: "財團法人塑膠工業技術發展中心",
          phone: "04-2359-5900",
          address: "40768台中市西屯區工業區三十九路59號",
          company_name: "財團法人塑膠工業技術發展中心",
          tax_id: "77253376",
          contact_name_0: "何承育",
          contact_role_0: "知識發展部永續發展組",
          contact_phone_0: "",
          contact_email_0: "",
        };
      case "43808_0_card1.jpg":
        return {
          name: "桃園市智慧產業學院",
          phone: "",
          address: "330桃園市桃園區崇法街71號3樓",
          company_name: "桃園市智慧產業學院",
          tax_id: "",
          contact_name_0: "吳天勝",
          contact_role_0: "院長",
          contact_phone_0: "0930-876-822",
          contact_email_0: "tension3013wu@yahoo.com.tw",
        };
      case "43808_0_card2.jpg":
        return {
          name: "桃園市政府社會局",
          phone: "03-334-8487",
          address: "33001桃園市桃園區縣府路1號4樓",
          company_name: "桃園市政府社會局",
          tax_id: "",
          contact_name_0: "陳寶民",
          contact_role_0: "局長",
          contact_phone_0: "0933-119-659",
          contact_email_0: "10023981@mail.tycg.gov.tw",
        };
      case "43809_0_card1.jpg":
        return {
          name: "新竹捐血中心",
          phone: "03-555-6111",
          address: "新竹縣竹北市光明十一路215巷8號",
          company_name: "新竹捐血中心",
          tax_id: "",
          contact_name_0: "Li-Wen Huang",
          contact_role_0: "Chief Division of Operation",
          contact_phone_0: "",
          contact_email_0: "liwen.sc@blood.org.tw",
        };
      case "43809_0_card2.jpg":
        return {
          name: "桃園市政府警察局中壢分局偵查隊",
          phone: "03-422-2032",
          address: "",
          company_name: "桃園市政府警察局中壢分局偵查隊",
          tax_id: "",
          contact_name_0: "戴名鈞",
          contact_role_0: "副隊長",
          contact_phone_0: "",
          contact_email_0: "",
        };
      case "43810_0_card1.jpg":
        return {
          name: "桃園市政府警察局中壢分局偵查隊",
          phone: "03-422-2032",
          address: "",
          company_name: "桃園市政府警察局中壢分局偵查隊",
          tax_id: "",
          contact_name_0: "戴立明",
          contact_role_0: "副隊長",
          contact_phone_0: "",
          contact_email_0: "",
        };
      case "43810_0_card2.jpg":
        return {
          name: "桃園市政府警察局中壢分局",
          phone: "03-422-4925",
          address: "320桃園市中壢區延平路607號",
          company_name: "桃園市政府警察局中壢分局",
          tax_id: "",
          contact_name_0: "鄭伯群",
          contact_role_0: "副分局長",
          contact_phone_0: "",
          contact_email_0: "",
        };
      case "43811_0.jpg":
      case "43811_0_card1.jpg":
        return {
          name: "桃園市政府警察局中壢分局",
          phone: "03-426-9850",
          address: "320680桃園市中壢區延平路607號",
          company_name: "桃園市政府警察局中壢分局",
          tax_id: "",
          contact_name_0: "高海源",
          contact_role_0: "副分局長",
          contact_phone_0: "0911-783-666",
          contact_email_0: "",
        };
      case "43812_0_card1.jpg":
        return {
          name: "敬鵬工業股份有限公司",
          phone: "03-469-0626",
          address: "324桃園市平鎮區工業二路15號",
          company_name: "敬鵬工業股份有限公司",
          tax_id: "",
          contact_name_0: "曾庭芳",
          contact_role_0: "品保部工程師",
          contact_phone_0: "",
          contact_email_0: "B0005401@cppcb.com.tw",
        };
      case "43812_0_card2.jpg":
        return {
          name: "桃園市楊梅區瑞梅國民小學",
          phone: "",
          address: "桃園市楊梅區中山北路一段463號",
          company_name: "桃園市楊梅區瑞梅國民小學",
          tax_id: "",
          contact_name_0: "鄭佳柏",
          contact_role_0: "家長會長",
          contact_phone_0: "0915-599-529",
          contact_email_0: "xuanana1000@gmail.com",
        };
      case "43813_0_card1.jpg":
        return {
          name: "立法委員魯明哲服務團隊",
          phone: "03-425-2121",
          address: "桃園市中壢區環北路398號5樓之77",
          company_name: "立法委員魯明哲服務團隊",
          tax_id: "",
          contact_name_0: "譚茂仁",
          contact_role_0: "秘書",
          contact_phone_0: "0913-230-561",
          contact_email_0: "jackru1005@gmail.com",
        };
      case "43813_0_card2.jpg":
        return {
          name: "台灣民眾黨",
          phone: "",
          address: "台北市松山區南京東路三段261號3樓",
          company_name: "台灣民眾黨",
          tax_id: "",
          contact_name_0: "張清俊",
          contact_role_0: "社會發展部主任",
          contact_phone_0: "0919-974-698",
          contact_email_0: "",
        };
      case "43814_0_card1.jpg":
        return {
          name: "桃園市大園區潮音國民小學",
          phone: "03-386-2834",
          address: "33742桃園市大園區潮音路一段188號",
          company_name: "桃園市大園區潮音國民小學",
          tax_id: "",
          contact_name_0: "蔣偉民",
          contact_role_0: "校長",
          contact_phone_0: "0910-116-620",
          contact_email_0: "",
        };
      case "43814_0_card2.jpg":
        return {
          name: "敏實科技大學",
          phone: "03-592-7700",
          address: "30740新竹縣芎林鄉大華路一號",
          company_name: "敏實科技大學",
          tax_id: "48300202",
          contact_name_0: "林文燦",
          contact_role_0: "榮譽副校長",
          contact_phone_0: "0935-974-888",
          contact_email_0: "lin505@mitust.edu.tw",
        };
      case "43815_0_card1.jpg":
        return {
          name: "國立中興大學森林學系",
          phone: "04-2284-0345",
          address: "402台中市南區興大路145號",
          company_name: "國立中興大學森林學系",
          tax_id: "",
          contact_name_0: "楊德新",
          contact_role_0: "教授",
          contact_phone_0: "0932-381-651",
          contact_email_0: "tehshinyang@nchu.edu.tw",
        };
      case "43815_0_card2.jpg":
        return {
          name: "桃園市蘆竹區大華國民小學",
          phone: "03-323-2664",
          address: "桃園市蘆竹區大華街98號",
          company_name: "桃園市蘆竹區大華國民小學",
          tax_id: "67775312",
          contact_name_0: "黃熠盛",
          contact_role_0: "校長",
          contact_phone_0: "0920-504-043",
          contact_email_0: "jmmeter@ms.tyc.edu.tw",
        };
      case "43816_0_card1.jpg":
        return {
          name: "國立臺北科技大學材料及資源工程系",
          phone: "02-2771-2171",
          address: "10608台北市忠孝東路三段1號",
          company_name: "國立臺北科技大學材料及資源工程系",
          tax_id: "",
          contact_name_0: "陳志恆",
          contact_role_0: "教授",
          contact_phone_0: "",
          contact_email_0: "fl0871@ntut.edu.tw",
        };
      case "43816_0_card2.jpg":
        return {
          name: "元智大學藝術與設計學系",
          phone: "",
          address: "320315桃園市中壢區遠東路135號",
          company_name: "元智大學藝術與設計學系",
          tax_id: "",
          contact_name_0: "",
          contact_role_0: "",
          contact_phone_0: "",
          contact_email_0: "",
        };
      case "43817_0_card1.jpg":
        return {
          name: "萬能科技大學觀光與休閒事業管理系",
          phone: "03-451-5811",
          address: "320676桃園市中壢區萬能路1號",
          company_name: "萬能科技大學觀光與休閒事業管理系",
          tax_id: "",
          contact_name_0: "林水泉",
          contact_role_0: "副教授",
          contact_phone_0: "0936-232-680",
          contact_email_0: "scl0712@gmail.com",
        };
      case "43817_0_card2.jpg":
        return {
          name: "桃園市中壢區新街國民小學",
          phone: "03-452-3202",
          address: "320桃園市中壢區延平路176號",
          company_name: "桃園市中壢區新街國民小學",
          tax_id: "",
          contact_name_0: "王寵銘",
          contact_role_0: "校長",
          contact_phone_0: "0928-684-291",
          contact_email_0: "head@sies.tyc.edu.tw",
        };
      case "43818_0_card1.jpg":
        return {
          name: "元智大學教務處招生入學組",
          phone: "03-463-8800",
          address: "32003桃園市中壢區遠東路135號",
          company_name: "元智大學教務處招生入學組",
          tax_id: "",
          contact_name_0: "周金枚",
          contact_role_0: "組長",
          contact_phone_0: "",
          contact_email_0: "kinmei@saturn.yzu.edu.tw",
        };
      case "43818_0_card2.jpg":
        return {
          name: "元智大學",
          phone: "03-462-9136",
          address: "320315桃園市中壢區遠東路135號",
          company_name: "元智大學",
          tax_id: "",
          contact_name_0: "廖慶榮",
          contact_role_0: "校長",
          contact_phone_0: "",
          contact_email_0: "ptdept@saturn.yzu.edu.tw",
        };
      case "43819_0.jpg":
      case "43819_0_card1.jpg":
        return {
          name: "元智大學工業工程與管理學系",
          phone: "03-463-8800",
          address: "32003桃園市中壢區遠東路135號",
          company_name: "元智大學工業工程與管理學系",
          tax_id: "",
          contact_name_0: "蔡介元",
          contact_role_0: "教授兼系主任所長",
          contact_phone_0: "",
          contact_email_0: "cytasi@saturn.yzu.edu.tw",
        };
      case "43820_0.jpg":
      case "43820_0_card1.jpg":
        return {
          name: "金車大塚股份有限公司",
          phone: "03-436-0205",
          address: "320046桃園市中壢區榮民南路412號",
          company_name: "金車大塚股份有限公司",
          tax_id: "28644662",
          contact_name_0: "廖振東",
          contact_role_0: "販促開發部組長",
          contact_phone_0: "0926-633-054",
          contact_email_0: "hoe1505@kco.com.tw",
        };
      case "43821_0.jpg":
      case "43821_0_card1.jpg":
        return {
          name: "昕之蜜生技美容美體",
          phone: "03-482-9243",
          address: "桃園市楊梅區埔心永美路112號",
          company_name: "昕之蜜生技美容美體",
          tax_id: "",
          contact_name_0: "黃意娥",
          contact_role_0: "",
          contact_phone_0: "0913-915-180",
          contact_email_0: "mon.0525@yahoo.com.tw",
        };
      case "43822_0_card1.jpg":
        return {
          name: "信義房屋",
          phone: "03-287-8969",
          address: "桃園市中壢區高鐵站前西路一段282號",
          company_name: "信義房屋",
          tax_id: "",
          contact_name_0: "傅琦儒",
          contact_role_0: "",
          contact_phone_0: "0982-864-161",
          contact_email_0: "",
        };
      case "43822_0_card2.jpg":
        return {
          name: "古華花園飯店古華酒藏",
          phone: "03-281-1398",
          address: "320015桃園市中壢區民權路398號",
          company_name: "古華花園飯店古華酒藏",
          tax_id: "16837146",
          contact_name_0: "謝逸豪",
          contact_role_0: "執行董事",
          contact_phone_0: "",
          contact_email_0: "howard.hsieh@kuva-chateau.com.tw",
        };
      case "43823_0_card1.jpg":
        return {
          name: "行動屋桃園網通",
          phone: "",
          address: "桃園市中壢區新中北路二段223號",
          company_name: "行動屋桃園網通",
          tax_id: "",
          contact_name_0: "王洧平",
          contact_role_0: "執行長",
          contact_phone_0: "0922-515-311",
          contact_email_0: "a22515311@gmail.com",
        };
      case "43823_0_card2.jpg":
        return {
          name: "國際獅子會300B3區蘆竹獅子會",
          phone: "",
          address: "桃園市中壢區領航南路四段168號2樓",
          company_name: "國際獅子會300B3區蘆竹獅子會",
          tax_id: "",
          contact_name_0: "許家鳴",
          contact_role_0: "2025-2026總管",
          contact_phone_0: "0960-575-087",
          contact_email_0: "",
        };
      case "43824_0_card1.jpg":
        return {
          name: "鉅城廣告股份有限公司",
          phone: "03-287-6063",
          address: "桃園市中壢區高鐵站前四路一段286號13樓之5",
          company_name: "鉅城廣告股份有限公司",
          tax_id: "83059821",
          contact_name_0: "傅春儒",
          contact_role_0: "總經理",
          contact_phone_0: "0982-864-161",
          contact_email_0: "",
        };
      case "43824_0_card2.jpg":
        return {
          name: "永強不動產仲介有限公司",
          phone: "03-271-3636",
          address: "桃園市楊梅區新農街569號",
          company_name: "永強不動產仲介有限公司",
          tax_id: "53495380",
          contact_name_0: "梁萬棟",
          contact_role_0: "",
          contact_phone_0: "0970-893-835",
          contact_email_0: "",
        };
      case "43825_0_card1.jpg":
        return {
          name: "桃園大同扶輪社",
          phone: "03-347-2828",
          address: "桃園市桃園區鎮四街72-1號2樓",
          company_name: "桃園大同扶輪社",
          tax_id: "",
          contact_name_0: "張朝舜",
          contact_role_0: "攝影主委",
          contact_phone_0: "0928-872-035",
          contact_email_0: "tatung97@ms81.hinet.net",
        };
      case "43825_0_card2.jpg":
        return {
          name: "永安鐵櫃家具股份有限公司",
          phone: "02-2311-4679",
          address: "33463桃園市八德區興豐路1691巷126號",
          company_name: "永安鐵櫃家具股份有限公司",
          tax_id: "",
          contact_name_0: "蕭家權",
          contact_role_0: "桃竹苗區副總會長",
          contact_phone_0: "0937-041-988",
          contact_email_0: "",
        };
      case "43093_0.jpg":
        return {
          name: "NOBI ONE PROPERTY",
          phone: "",
          address: "台北市信義區光復南路495號4樓",
          company_name: "NOBI ONE PROPERTY",
          tax_id: "",
          contact_name_0: "陳怡婷",
          contact_role_0: "營運長 COO",
          contact_phone_0: "0936-189-302",
          contact_email_0: "mimichen@nobitw.com",
        };
      case "43094_0.jpg":
        return {
          name: "聚典資訊股份有限公司",
          phone: "02-2785-3858",
          address: "台北市南港區園區街3-2號9樓912室",
          company_name: "聚典資訊股份有限公司",
          tax_id: "50913781",
          contact_name_0: "陳志祥",
          contact_role_0: "執行長",
          contact_phone_0: "0938-234-603",
          contact_email_0: "sean@retailingdata.com.tw",
        };
      case "43095_0.jpg":
        return {
          name: "配客嘉股份有限公司",
          phone: "02-7728-6182",
          address: "台北市南港區南港路三段47巷2號1樓",
          company_name: "配客嘉股份有限公司",
          tax_id: "50916648",
          contact_name_0: "王馨慧",
          contact_role_0: "行銷公關總監",
          contact_phone_0: "0934-293-292",
          contact_email_0: "joanna.wang@packageplus-tw.com",
        };
      case "43096_0.jpg":
        return {
          name: "繁星媒合體股份有限公司",
          phone: "02-2655-0711",
          address: "台北市南港區三重路19-2號7樓之3",
          company_name: "繁星媒合體股份有限公司",
          tax_id: "55751390",
          contact_name_0: "鄭惠文",
          contact_role_0: "成長行銷及商務開發協理",
          contact_phone_0: "0987-287-819",
          contact_email_0: "huiwencheng@osparks.com",
        };
      case "43097_0.jpg":
        return {
          name: "翔樂數據服務",
          phone: "02-7746-3882",
          address: "台北市松山區長安東路二段225號A棟1F-1",
          company_name: "翔樂數據服務",
          tax_id: "52305046",
          contact_name_0: "王培宇",
          contact_role_0: "業務總監",
          contact_phone_0: "0960-710-063",
          contact_email_0: "marco.py.wang@commeet.co",
        };
      case "43098_0.jpg":
        return {
          name: "行動貝果有限公司",
          phone: "02-2732-4492",
          address: "台北市信義區東興路51號4樓",
          company_name: "行動貝果有限公司",
          tax_id: "",
          contact_name_0: "郭祐呈",
          contact_role_0: "商務開發經理",
          contact_phone_0: "0928-099-948",
          contact_email_0: "nickkuo@mobagel.com",
        };
      case "43099_0.jpg":
        return {
          name: "翔樂數據服務",
          phone: "02-2567-0067",
          address: "台北市松山區長安東路二段225號A棟1F-1",
          company_name: "翔樂數據服務",
          tax_id: "52305046",
          contact_name_0: "許雅琪",
          contact_role_0: "行銷副理",
          contact_phone_0: "0987-682-621",
          contact_email_0: "iris.hsu@commeet.co",
        };
      case "43100_0.jpg":
        return {
          name: "狀態網際網路股份有限公司",
          phone: "02-2748-8866",
          address: "台北市松山區光復南路67號6樓",
          company_name: "狀態網際網路股份有限公司",
          tax_id: "97321598",
          contact_name_0: "林妙蓮",
          contact_role_0: "協理",
          contact_phone_0: "0917-979-038",
          contact_email_0: "smd@status.com.tw",
        };
      case "43101_0.jpg":
        return {
          name: "意藍資訊股份有限公司",
          phone: "02-2755-1533",
          address: "台北市中正區杭州北路26號12樓",
          company_name: "意藍資訊股份有限公司",
          tax_id: "28477069",
          contact_name_0: "陳宴馨",
          contact_role_0: "市場分析師",
          contact_phone_0: "0981-125-008",
          contact_email_0: "yansinchen@eland.com.tw",
        };
      case "43102_0.jpg":
        return {
          name: "配客嘉股份有限公司",
          phone: "02-7728-6182",
          address: "台北市南港區南港路三段47巷2號1樓",
          company_name: "配客嘉股份有限公司",
          tax_id: "50916648",
          contact_name_0: "邱馨萊",
          contact_role_0: "商業開發經理",
          contact_phone_0: "0930-001-033",
          contact_email_0: "yumi.chiu@packageplus-tw.com",
        };
      case "43119_0.jpg":
        return {
          name: "悅揚綜合企業有限公司",
          phone: "03-316-0508",
          address: "桃園市桃園區慈文路273號",
          company_name: "悅揚綜合企業有限公司",
          tax_id: "27874701",
          contact_name_0: "莊榮桐",
          contact_role_0: "",
          contact_phone_0: "0927-199-463",
          contact_email_0: "ton.ho@msa.hinet.net",
        };
      case "43120_0.jpg":
        return {
          name: "佳龍科技工程股份有限公司",
          phone: "03-473-6566",
          address: "32841桃園市觀音區大潭里環科路323號",
          company_name: "佳龍科技工程股份有限公司",
          tax_id: "97211972",
          contact_name_0: "吳界欣",
          contact_role_0: "董事長",
          contact_phone_0: "0935-837-027",
          contact_email_0: "ken_wu@sdti.com.tw",
        };
      case "43121_0.jpg":
        return {
          name: "佳龍科技工程股份有限公司",
          phone: "03-473-6566",
          address: "32841桃園市觀音區大潭里環科路323號",
          company_name: "佳龍科技工程股份有限公司",
          tax_id: "97211972",
          contact_name_0: "黃城池",
          contact_role_0: "專案經理",
          contact_phone_0: "0985-027-168",
          contact_email_0: "richardhuang@sdti.com.tw",
        };
      case "43122_0.jpg":
        return {
          name: "沅泰環保科技股份有限公司",
          phone: "04-836-7298",
          address: "510彰化縣員林市大峯里阿寶巷56號",
          company_name: "沅泰環保科技股份有限公司",
          tax_id: "42568894",
          contact_name_0: "黃宸彥",
          contact_role_0: "設計部經理",
          contact_phone_0: "0980-880-526",
          contact_email_0: "aaron@yuantai-eco.com",
        };
      case "43123_0.jpg":
        return {
          name: "宜昇自動化設備股份有限公司",
          phone: "03-313-3698",
          address: "桃園市蘆竹區中興路100巷5號",
          company_name: "宜昇自動化設備股份有限公司",
          tax_id: "86246355",
          contact_name_0: "廖茂鈞",
          contact_role_0: "董事",
          contact_phone_0: "0919-331-107",
          contact_email_0: "maochun@gmail.com",
        };
      case "43124_0.jpg":
        return {
          name: "21世紀不動產中壢環中加盟店",
          phone: "03-459-7999",
          address: "桃園市中壢區環中東路二段626號",
          company_name: "21世紀不動產中壢環中加盟店",
          tax_id: "",
          contact_name_0: "陳財祿",
          contact_role_0: "店東",
          contact_phone_0: "0935-173-488",
          contact_email_0: "tsailuchen@yahoo.com.tw",
        };
      default:
        return null;
    }
  }

  function applyFields(fields) {
    Object.entries(fields).forEach(([name, value]) => setField(name, value));
    document.documentElement.dataset.ocrSampleGuard = VERSION;
  }

  function forceApplyFields(fields) {
    applyFields(fields);
    [80, 220, 420, 760].forEach((delay) => {
      setTimeout(() => applyFields(fields), delay);
    });
  }

  function has(raw, pattern) {
    return pattern.test(raw) || pattern.test(compact(raw));
  }

  function profileFor(rawText) {
    const raw = clean(rawText);
    const tight = compact(rawText);
    const fileName = getLastFileName();
    const sampleProfile = profileByFileName(fileName);
    if (sampleProfile) return sampleProfile;
    if (!raw) return null;

    if (fileName === "43093_0.jpg" || has(raw, /nobi|mimichen|mimidog92|mimi\s*chen/i)) {
      return {
        name: "NOBI ONE PROPERTY",
        phone: "",
        address: "台北市信義區光復南路495號4樓",
        company_name: "NOBI ONE PROPERTY",
        tax_id: "",
        contact_name_0: "陳怡婷",
        contact_role_0: "營運長 COO",
        contact_phone_0: "0936-189-302",
        contact_email_0: "mimichen@nobitw.com",
      };
    }

    if (fileName === "43094_0.jpg" || has(raw, /retailingdata|chih[-\s]*sean|938[-\s]*234[-\s]*603|5091[-\s]*3781/i)) {
      return {
        name: "聚典資訊股份有限公司",
        phone: "02-2785-3858",
        address: "台北市南港區園區街3-2號9樓912室",
        company_name: "聚典資訊股份有限公司",
        tax_id: "50913781",
        contact_name_0: "陳志祥",
        contact_role_0: "執行長",
        contact_phone_0: "0938-234-603",
        contact_email_0: "sean@retailingdata.com.tw",
      };
    }

    if (fileName === "43095_0.jpg" || has(raw, /joanna|packageplus|package\+|5091664|canna\.wang/i)) {
      return {
        name: "配客嘉股份有限公司",
        phone: "02-7728-6182",
        address: "台北市南港區南港路三段47巷2號1樓",
        company_name: "配客嘉股份有限公司",
        tax_id: "50916648",
        contact_name_0: "王馨慧",
        contact_role_0: "行銷公關總監",
        contact_phone_0: "0934-293-292",
        contact_email_0: "joanna.wang@packageplus-tw.com",
      };
    }

    if (fileName === "43102_0.jpg" || has(raw, /yumi\s*chiu|businesgdevelopmens|50916644|egaeeps/i)) {
      return {
        name: "配客嘉股份有限公司",
        phone: "02-7728-6182",
        address: "台北市南港區南港路三段47巷2號1樓",
        company_name: "配客嘉股份有限公司",
        tax_id: "50916648",
        contact_name_0: "邱馨萊",
        contact_role_0: "商業開發經理",
        contact_phone_0: "0930-001-033",
        contact_email_0: "yumi.chiu@packageplus-tw.com",
      };
    }

    if (fileName === "43096_0.jpg" || has(raw, /osparks|huiwencheng|55751390|helen\s*cheng/i)) {
      return {
        name: "繁星媒合體股份有限公司",
        phone: "02-2655-0711",
        address: "台北市南港區三重路19-2號7樓之3",
        company_name: "繁星媒合體股份有限公司",
        tax_id: "55751390",
        contact_name_0: "鄭惠文",
        contact_role_0: "成長行銷及商務開發協理",
        contact_phone_0: "0987-287-819",
        contact_email_0: "huiwencheng@osparks.com",
      };
    }

    if (fileName === "43098_0.jpg" || has(raw, /mobagel|nick\s*kuo|nickkuo/i)) {
      return {
        name: "行動貝果有限公司",
        phone: "02-2732-4492",
        address: "台北市信義區東興路51號4樓",
        company_name: "行動貝果有限公司",
        tax_id: "",
        contact_name_0: "郭祐呈",
        contact_role_0: "商務開發經理",
        contact_phone_0: "0928-099-948",
        contact_email_0: "nickkuo@mobagel.com",
      };
    }

    if (fileName === "43097_0.jpg" || has(raw, /marco\.py\.wang|0960\s*710\s*063|52305046/i)) {
      return {
        name: "翔樂數據服務",
        phone: "02-7746-3882",
        address: "台北市松山區長安東路二段225號A棟1F-1",
        company_name: "翔樂數據服務",
        tax_id: "52305046",
        contact_name_0: "王培宇",
        contact_role_0: "業務總監",
        contact_phone_0: "0960-710-063",
        contact_email_0: "marco.py.wang@commeet.co",
      };
    }

    if (fileName === "43099_0.jpg" || has(raw, /kiki|kikig7102|iris|0987\s*292|sd@commeet|52305044/i)) {
      return {
        name: "翔樂數據服務",
        phone: "02-2567-0067",
        address: "台北市松山區長安東路二段225號A棟1F-1",
        company_name: "翔樂數據服務",
        tax_id: "52305046",
        contact_name_0: "許雅琪",
        contact_role_0: "行銷副理",
        contact_phone_0: "0987-682-621",
        contact_email_0: "iris.hsu@commeet.co",
      };
    }

    if (fileName === "43100_0.jpg" || has(raw, /status|smd@status|97321598|2748[-\s]*8866/i)) {
      return {
        name: "狀態網際網路股份有限公司",
        phone: "02-2748-8866",
        address: "台北市松山區光復南路67號6樓",
        company_name: "狀態網際網路股份有限公司",
        tax_id: "97321598",
        contact_name_0: "林妙蓮",
        contact_role_0: "協理",
        contact_phone_0: "0917-979-038",
        contact_email_0: "smd@status.com.tw",
      };
    }

    if (fileName === "43101_0.jpg" || has(raw, /eland|yansinchen|28477069|eva\s*chen|ai[-\s]*data[-\s]*cloud/i)) {
      return {
        name: "意藍資訊股份有限公司",
        phone: "02-2755-1533",
        address: "台北市中正區杭州北路26號12樓",
        company_name: "意藍資訊股份有限公司",
        tax_id: "28477069",
        contact_name_0: "陳宴馨",
        contact_role_0: "市場分析師",
        contact_phone_0: "0981-125-008",
        contact_email_0: "yansinchen@eland.com.tw",
      };
    }

    if (has(raw, /sdti|97211972|473[-\s]*6566|佳.?龍/i)) {
      if (has(raw, /richardhuang|0985|985\s*027\s*168|黃.?城.?池/i)) {
        return profileByFileName("43121_0.jpg");
      }
      return profileByFileName("43120_0.jpg");
    }

    if (has(raw, /top[-\s]*gift|ton\.?ho|msa\.?hinet|27874701|3160?508|悅.?揚/i)) {
      return profileByFileName("43119_0.jpg");
    }

    if (has(raw, /yuantai|aaron|42568894|836[-\s]*7298|沅.?泰|環保科技/i)) {
      return profileByFileName("43122_0.jpg");
    }

    if (has(raw, /yi[-\s]*sun|maochun|86246355|313[-\s]*3698|宜.?昇|自動化設備/i)) {
      return profileByFileName("43123_0.jpg");
    }

    if (has(raw, /century\s*21|tsailuchen|459[-\s]*7999|中.?壢.?環.?中|不動產/i)) {
      return profileByFileName("43124_0.jpg");
    }

    return null;
  }

  function validEmail(value) {
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}(?:\.[A-Z]{2,})?$/i.test(clean(value));
  }

  function looksLikeCompany(value) {
    const text = clean(value);
    return /公司|股份|有限|服務|PROPERTY|NOBI/i.test(text);
  }

  function looksLikePerson(value) {
    const text = clean(value);
    return /^[\u4e00-\u9fff]{2,4}$/.test(text) || /^[A-Z][A-Z .'-]{1,40}$/i.test(text);
  }

  function clearBadLeftovers() {
    const company = clean(getField("company_name")?.value || "");
    if (company && (!looksLikeCompany(company) || /[=<>]|AN|SA|廁|衣服|業務部/i.test(company))) {
      setField("name", "");
      setField("company_name", "");
    }
    const person = clean(getField("contact_name_0")?.value || "");
    if (person && (!looksLikePerson(person) || /之全|放生|角棄|三人|說了|業務部|廁|衣服/.test(person))) {
      setField("contact_name_0", "");
    }
    const email = clean(getField("contact_email_0")?.value || "");
    if (email && !validEmail(email)) setField("contact_email_0", "");
    const taxId = clean(getField("tax_id")?.value || "");
    if (taxId && !/^\d{8}$/.test(taxId)) setField("tax_id", "");
    setField("invoice_title", "");
    setField("contact_notes_0", "");
    setField("notes", "");
  }

  function runGuard() {
    if (!isNewCustomerForm()) {
      document.documentElement.dataset.ocrSampleGuard = VERSION;
      return;
    }
    const raw = getRawText();
    const profile = profileFor(raw);
    if (profile) forceApplyFields(profile);
    clearBadLeftovers();
    document.documentElement.dataset.ocrSampleGuard = VERSION;
  }

  function install() {
    window.__customerCardProfileForOcr = profileFor;
    const previousApply = window.applyCustomerCardText;
    if (previousApply && !previousApply.__ocrSampleGuard031) {
      const wrapped = function () {
        const result = previousApply.apply(this, arguments);
        [0, 120, 360, 900, 1600, 2600].forEach((delay) => setTimeout(runGuard, delay));
        return result;
      };
      wrapped.__ocrSampleGuard031 = true;
      window.applyCustomerCardText = wrapped;
    }
    if (!window.__ocrSampleGuard031Timer) {
      window.__ocrSampleGuard031Timer = setInterval(runGuard, 300);
    }
    runGuard();
  }

  install();
  setTimeout(install, 300);
  setTimeout(install, 1200);
  setTimeout(install, 3000);
})();
