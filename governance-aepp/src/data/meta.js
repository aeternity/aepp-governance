import logo from '../assets/favicon.svg'
export default (title, description) => [
  {property: "og:title", content: `${title} - Aeternity Governance`, vmid: "og:title"},
  {property: "og:description", content: description, vmid: "og:description"},
  {property: "og:url", content: window.location.href.split("?")[0], vmid: "og:url"},
  {property: "og:type", content: "website", vmid: "og:type"},
  {property: "og:image", content: logo, vmid: "og:image"},
  {property: "og:site_name", content: "Governance by Aeternity", vmid: "og:site_name"},
  {property: "twitter:card", content: "summary", vmid:"twitter:card"},
  {property: "twitter:site", content: "@aeternity", vmid:"twitter:site"}
]
