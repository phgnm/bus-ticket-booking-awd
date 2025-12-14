// server/src/constants/locationAliases.js

const LOCATION_MAP = {
    // --- MIỀN NAM ---
    // TP. Hồ Chí Minh
    'sài gòn': 'Hồ Chí Minh',
    'sai gon': 'Hồ Chí Minh',
    'sg': 'Hồ Chí Minh',
    'hcm': 'Hồ Chí Minh',
    'tphcm': 'Hồ Chí Minh',
    'tp hcm': 'Hồ Chí Minh',
    'thành phố hồ chí minh': 'Hồ Chí Minh',
    'ho chi minh': 'Hồ Chí Minh',

    // Bà Rịa - Vũng Tàu
    'vũng tàu': 'Vũng Tàu',
    'vung tau': 'Vũng Tàu',
    'vt': 'Vũng Tàu',
    'bà rịa': 'Vũng Tàu',
    'brvt': 'Vũng Tàu',

    // Cần Thơ
    'cần thơ': 'Cần Thơ',
    'can tho': 'Cần Thơ',
    'ct': 'Cần Thơ',
    'tây đô': 'Cần Thơ',

    // Đà Lạt (Lâm Đồng)
    'đà lạt': 'Đà Lạt', // Hoặc 'Lâm Đồng' tùy DB
    'da lat': 'Đà Lạt',
    'dl': 'Đà Lạt',
    'lâm đồng': 'Đà Lạt',
    'lam dong': 'Đà Lạt',

    // Nha Trang (Khánh Hòa)
    'nha trang': 'Nha Trang', // Hoặc 'Khánh Hòa' tùy DB
    'nhatrang': 'Nha Trang',
    'nt': 'Nha Trang',
    'khánh hòa': 'Nha Trang',
    'khanh hoa': 'Nha Trang',

    // Phú Quốc (Kiên Giang)
    'phú quốc': 'Phú Quốc',
    'phu quoc': 'Phú Quốc',
    'pq': 'Phú Quốc',
    'đảo ngọc': 'Phú Quốc',
    'kiên giang': 'Rạch Giá', // Tùy chọn map về tỉnh lỵ
    'rạch giá': 'Rạch Giá',
    'rach gia': 'Rạch Giá',

    // Phan Thiết (Bình Thuận)
    'phan thiết': 'Phan Thiết',
    'phan thiet': 'Phan Thiết',
    'pt': 'Phan Thiết',
    'mui ne': 'Phan Thiết',
    'mũi né': 'Phan Thiết',
    'bình thuận': 'Phan Thiết',

    // Đồng Nai
    'đồng nai': 'Biên Hòa',
    'dong nai': 'Biên Hòa',
    'biên hòa': 'Biên Hòa',
    'bien hoa': 'Biên Hòa',

    // Bình Dương
    'bình dương': 'Bình Dương',
    'binh duong': 'Bình Dương',
    'thủ dầu một': 'Bình Dương',
    'bd': 'Bình Dương',

    // Tây Ninh
    'tây ninh': 'Tây Ninh',
    'tay ninh': 'Tây Ninh',
    'tn': 'Tây Ninh',

    // Cà Mau
    'cà mau': 'Cà Mau',
    'ca mau': 'Cà Mau',
    'cm': 'Cà Mau',

    // --- MIỀN TRUNG ---
    // Đà Nẵng
    'đà nẵng': 'Đà Nẵng',
    'da nang': 'Đà Nẵng',
    'dn': 'Đà Nẵng',
    'đn': 'Đà Nẵng',

    // Huế
    'huế': 'Thừa Thiên Huế',
    'hue': 'Thừa Thiên Huế',
    'thừa thiên huế': 'Thừa Thiên Huế',
    'thua thien hue': 'Thừa Thiên Huế',

    // Quảng Nam (Hội An)
    'hội an': 'Quảng Nam',
    'hoi an': 'Quảng Nam',
    'quảng nam': 'Quảng Nam',
    'quang nam': 'Quảng Nam',
    'tam kỳ': 'Quảng Nam',

    // Quảng Ngãi
    'quảng ngãi': 'Quảng Ngãi',
    'quang ngai': 'Quảng Ngãi',

    // Bình Định (Quy Nhơn)
    'quy nhơn': 'Quy Nhơn',
    'quy nhon': 'Quy Nhơn',
    'qn': 'Quy Nhơn',
    'bình định': 'Quy Nhơn',
    'binh dinh': 'Quy Nhơn',

    // Phú Yên
    'phú yên': 'Tuy Hòa',
    'phu yen': 'Tuy Hòa',
    'tuy hòa': 'Tuy Hòa',
    'tuy hoa': 'Tuy Hòa',
    'hoa vàng cỏ xanh': 'Tuy Hòa',

    // Nghệ An (Vinh)
    'vinh': 'Nghệ An',
    'nghệ an': 'Nghệ An',
    'nghe an': 'Nghệ An',
    'na': 'Nghệ An',

    // Thanh Hóa
    'thanh hóa': 'Thanh Hóa',
    'thanh hoa': 'Thanh Hóa',

    // --- MIỀN BẮC ---
    // Hà Nội
    'hà nội': 'Hà Nội',
    'ha noi': 'Hà Nội',
    'hn': 'Hà Nội',
    'thủ đô': 'Hà Nội',
    'thu do': 'Hà Nội',

    // Hải Phòng
    'hải phòng': 'Hải Phòng',
    'hai phong': 'Hải Phòng',
    'hp': 'Hải Phòng',
    'đất cảng': 'Hải Phòng',

    // Quảng Ninh (Hạ Long)
    'hạ long': 'Quảng Ninh',
    'ha long': 'Quảng Ninh',
    'quảng ninh': 'Quảng Ninh',
    'quang ninh': 'Quảng Ninh',
    'qninh': 'Quảng Ninh',
    'bãi cháy': 'Quảng Ninh',

    // Lào Cai (Sapa)
    'sapa': 'Lào Cai',
    'sa pa': 'Lào Cai',
    'lào cai': 'Lào Cai',
    'lao cai': 'Lào Cai',

    // Ninh Bình
    'ninh bình': 'Ninh Bình',
    'ninh binh': 'Ninh Bình',
    'nb': 'Ninh Bình',
    'tràng an': 'Ninh Bình',

    // Hà Giang
    'hà giang': 'Hà Giang',
    'ha giang': 'Hà Giang',
    'hg': 'Hà Giang',

    // Nam Định
    'nam định': 'Nam Định',
    'nam dinh': 'Nam Định',
    'nd': 'Nam Định',

    // Thái Bình
    'thái bình': 'Thái Bình',
    'thai binh': 'Thái Bình',
    'tb': 'Thái Bình',
};

module.exports = LOCATION_MAP;