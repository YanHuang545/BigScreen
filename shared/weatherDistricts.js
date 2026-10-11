/** Business districts inherit Open-Meteo weather from their admin district. */
export const BUSINESS_ADMIN = {
  国贸: '朝阳区',
  CBD: '朝阳区',
  金融街: '西城区',
  中关村: '海淀区',
  望京: '朝阳区',
  丽泽商务区: '丰台区',
  亦庄: '大兴区',
  三里屯: '朝阳区',
  王府井: '东城区',
  西单: '西城区',
}

export function adminDistrictOf(place) {
  if (place === '全市') return '全市'
  return BUSINESS_ADMIN[place] || place
}

export function attachBusinessWeather(adminWeather) {
  const next = { ...adminWeather }
  for (const [biz, admin] of Object.entries(BUSINESS_ADMIN)) {
    const src = adminWeather[admin]
    if (!src) continue
    next[biz] = { ...src, name: biz, admin }
  }
  return next
}
