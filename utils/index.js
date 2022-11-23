const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

const getJsonByUrlParams = async (baseUrl, params) => {
  const urlParams = new URLSearchParams()
  Object.entries(params).forEach(i => urlParams.append(...i))
  return await (await fetch(`${baseUrl}?${urlParams.toString()}`)).json()
}

const transpose = (arr) => arr[0]?.map((col, i) => arr.map(row => row[i]))

const ymdSlashed = (ymd) => [ymd.slice(0, 4), ymd.slice(4, 6), ymd.slice(6, 8)].join("-")

module.exports = {
  getJsonByUrlParams, transpose, ymdSlashed
}
