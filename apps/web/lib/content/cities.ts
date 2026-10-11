/**
 * Bundled birth-place lookup.
 *
 * Kundali maths needs coordinates, not a place name, and a silent mis-geocode
 * produces a wrong chart — worse than asking. So: an offline list of Indian
 * cities (covering the overwhelming majority of this practice's bookings)
 * plus a manual latitude/longitude override in the form for anywhere else.
 * No geocoding API, no per-call cost, no network dependency (PLAN.md §3.2).
 *
 * All of India is a single timezone, so `Asia/Kolkata` is the default and
 * only the override needs a timezone field.
 */
export const INDIA_TZ = "Asia/Kolkata";

// "Name|State|lat|lng" — compact on purpose; parsed once at module load.
const RAW = `
Mumbai|Maharashtra|19.0760|72.8777
Delhi|Delhi|28.6139|77.2090
Bengaluru|Karnataka|12.9716|77.5946
Hyderabad|Telangana|17.3850|78.4867
Ahmedabad|Gujarat|23.0225|72.5714
Chennai|Tamil Nadu|13.0827|80.2707
Kolkata|West Bengal|22.5726|88.3639
Surat|Gujarat|21.1702|72.8311
Pune|Maharashtra|18.5204|73.8567
Jaipur|Rajasthan|26.9124|75.7873
Lucknow|Uttar Pradesh|26.8467|80.9462
Kanpur|Uttar Pradesh|26.4499|80.3319
Nagpur|Maharashtra|21.1458|79.0882
Indore|Madhya Pradesh|22.7196|75.8577
Thane|Maharashtra|19.2183|72.9781
Bhopal|Madhya Pradesh|23.2599|77.4126
Visakhapatnam|Andhra Pradesh|17.6868|83.2185
Patna|Bihar|25.5941|85.1376
Vadodara|Gujarat|22.3072|73.1812
Ghaziabad|Uttar Pradesh|28.6692|77.4538
Ludhiana|Punjab|30.9010|75.8573
Agra|Uttar Pradesh|27.1767|78.0081
Nashik|Maharashtra|19.9975|73.7898
Faridabad|Haryana|28.4089|77.3178
Meerut|Uttar Pradesh|28.9845|77.7064
Rajkot|Gujarat|22.3039|70.8022
Varanasi|Uttar Pradesh|25.3176|82.9739
Srinagar|Jammu and Kashmir|34.0837|74.7973
Aurangabad|Maharashtra|19.8762|75.3433
Dhanbad|Jharkhand|23.7957|86.4304
Amritsar|Punjab|31.6340|74.8723
Navi Mumbai|Maharashtra|19.0330|73.0297
Allahabad|Uttar Pradesh|25.4358|81.8463
Ranchi|Jharkhand|23.3441|85.3096
Howrah|West Bengal|22.5958|88.2636
Coimbatore|Tamil Nadu|11.0168|76.9558
Jabalpur|Madhya Pradesh|23.1815|79.9864
Gwalior|Madhya Pradesh|26.2183|78.1828
Vijayawada|Andhra Pradesh|16.5062|80.6480
Jodhpur|Rajasthan|26.2389|73.0243
Madurai|Tamil Nadu|9.9252|78.1198
Raipur|Chhattisgarh|21.2514|81.6296
Kota|Rajasthan|25.2138|75.8648
Chandigarh|Chandigarh|30.7333|76.7794
Guwahati|Assam|26.1445|91.7362
Solapur|Maharashtra|17.6599|75.9064
Hubli|Karnataka|15.3647|75.1240
Mysuru|Karnataka|12.2958|76.6394
Tiruchirappalli|Tamil Nadu|10.7905|78.7047
Bareilly|Uttar Pradesh|28.3670|79.4304
Aligarh|Uttar Pradesh|27.8974|78.0880
Moradabad|Uttar Pradesh|28.8386|78.7733
Gurugram|Haryana|28.4595|77.0266
Jalandhar|Punjab|31.3260|75.5762
Bhubaneswar|Odisha|20.2961|85.8245
Salem|Tamil Nadu|11.6643|78.1460
Warangal|Telangana|17.9689|79.5941
Guntur|Andhra Pradesh|16.3067|80.4365
Bhiwandi|Maharashtra|19.3002|73.0586
Saharanpur|Uttar Pradesh|29.9680|77.5552
Gorakhpur|Uttar Pradesh|26.7606|83.3732
Bikaner|Rajasthan|28.0229|73.3119
Amravati|Maharashtra|20.9374|77.7796
Noida|Uttar Pradesh|28.5355|77.3910
Jamshedpur|Jharkhand|22.8046|86.2029
Bhilai|Chhattisgarh|21.1938|81.3509
Cuttack|Odisha|20.4625|85.8830
Firozabad|Uttar Pradesh|27.1592|78.3957
Kochi|Kerala|9.9312|76.2673
Dehradun|Uttarakhand|30.3165|78.0322
Durgapur|West Bengal|23.5204|87.3119
Ajmer|Rajasthan|26.4499|74.6399
Siliguri|West Bengal|26.7271|88.3953
Nanded|Maharashtra|19.1383|77.3210
Kolhapur|Maharashtra|16.7050|74.2433
Udaipur|Rajasthan|24.5854|73.7125
Thiruvananthapuram|Kerala|8.5241|76.9366
Thrissur|Kerala|10.5276|76.2144
Kozhikode|Kerala|11.2588|75.7804
Mangaluru|Karnataka|12.9141|74.8560
Belagavi|Karnataka|15.8497|74.4977
Tirupati|Andhra Pradesh|13.6288|79.4192
Nellore|Andhra Pradesh|14.4426|79.9865
Rourkela|Odisha|22.2604|84.8536
Shimla|Himachal Pradesh|31.1048|77.1734
Jammu|Jammu and Kashmir|32.7266|74.8570
Panaji|Goa|15.4909|73.8278
Imphal|Manipur|24.8170|93.9368
Shillong|Meghalaya|25.5788|91.8933
Agartala|Tripura|23.8315|91.2868
Aizawl|Mizoram|23.7271|92.7176
Kohima|Nagaland|25.6751|94.1086
Gangtok|Sikkim|27.3314|88.6138
Itanagar|Arunachal Pradesh|27.0844|93.6053
Dispur|Assam|26.1433|91.7898
Puducherry|Puducherry|11.9416|79.8083
Haridwar|Uttarakhand|29.9457|78.1642
Mathura|Uttar Pradesh|27.4924|77.6737
Ujjain|Madhya Pradesh|23.1765|75.7885
Rishikesh|Uttarakhand|30.0869|78.2676
Tirunelveli|Tamil Nadu|8.7139|77.7567
Vellore|Tamil Nadu|12.9165|79.1325
Bilaspur|Chhattisgarh|22.0797|82.1409
Muzaffarpur|Bihar|26.1197|85.3910
Gaya|Bihar|24.7914|85.0002
Bhagalpur|Bihar|25.2425|86.9842
Darbhanga|Bihar|26.1542|85.8918
Panipat|Haryana|29.3909|76.9635
Karnal|Haryana|29.6857|76.9905
Hisar|Haryana|29.1492|75.7217
Rohtak|Haryana|28.8955|76.6066
Patiala|Punjab|30.3398|76.3869
Bathinda|Punjab|30.2110|74.9455
Alwar|Rajasthan|27.5530|76.6346
Bharatpur|Rajasthan|27.2152|77.5030
Sikar|Rajasthan|27.6094|75.1399
Jhansi|Uttar Pradesh|25.4484|78.5685
Shahjahanpur|Uttar Pradesh|27.8815|79.9100
Rampur|Uttar Pradesh|28.7983|79.0250
Satna|Madhya Pradesh|24.5673|80.8322
Sagar|Madhya Pradesh|23.8388|78.7378
Ratlam|Madhya Pradesh|23.3315|75.0367
Akola|Maharashtra|20.7002|77.0082
Latur|Maharashtra|18.4088|76.5604
Ahmednagar|Maharashtra|19.0948|74.7480
Sangli|Maharashtra|16.8524|74.5815
Jalgaon|Maharashtra|21.0077|75.5626
Bhavnagar|Gujarat|21.7645|72.1519
Jamnagar|Gujarat|22.4707|70.0577
Junagadh|Gujarat|21.5222|70.4579
Gandhinagar|Gujarat|23.2156|72.6369
Anand|Gujarat|22.5645|72.9289
Davanagere|Karnataka|14.4644|75.9218
Ballari|Karnataka|15.1394|76.9214
Shivamogga|Karnataka|13.9299|75.5681
Tumakuru|Karnataka|13.3379|77.1173
Kurnool|Andhra Pradesh|15.8281|78.0373
Rajahmundry|Andhra Pradesh|16.9891|81.7837
Kakinada|Andhra Pradesh|16.9891|82.2475
Karimnagar|Telangana|18.4386|79.1288
Nizamabad|Telangana|18.6725|78.0941
Erode|Tamil Nadu|11.3410|77.7172
Thoothukudi|Tamil Nadu|8.7642|78.1348
Kollam|Kerala|8.8932|76.6141
Alappuzha|Kerala|9.4981|76.3388
Kannur|Kerala|11.8745|75.3704
Asansol|West Bengal|23.6739|86.9524
Bardhaman|West Bengal|23.2324|87.8615
Malda|West Bengal|25.0119|88.1433
Kharagpur|West Bengal|22.3460|87.2320
Berhampur|Odisha|19.3150|84.7941
Sambalpur|Odisha|21.4669|83.9812
Korba|Chhattisgarh|22.3595|82.7501
`;

export type City = {
  name: string;
  state: string;
  lat: number;
  lng: number;
  /** "Mumbai, Maharashtra" — what gets stored as the birth place. */
  label: string;
};

export const cities: City[] = RAW.trim()
  .split("\n")
  .map((line) => {
    const [name, state, lat, lng] = line.split("|");
    return {
      name: name!,
      state: state!,
      lat: Number(lat),
      lng: Number(lng),
      label: `${name}, ${state}`,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

/** Case-insensitive prefix-then-substring match, best matches first. */
export function searchCities(query: string, limit = 8): City[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const starts: City[] = [];
  const contains: City[] = [];

  for (const city of cities) {
    const name = city.name.toLowerCase();
    if (name.startsWith(q)) starts.push(city);
    else if (name.includes(q) || city.state.toLowerCase().includes(q)) {
      contains.push(city);
    }
    if (starts.length >= limit) break;
  }

  return [...starts, ...contains].slice(0, limit);
}
