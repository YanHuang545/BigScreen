import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { beijingWeather } from './weather.js'

const server = new McpServer({
  name: 'beijing-weather',
  version: '1.0.0',
})

server.registerTool(
  'beijing_weather',
  {
    title: '北京各区实时天气',
    description: '查询北京市及16个区今天的真实天气，数据来自 Open-Meteo。不传 district 时返回全部。',
    inputSchema: {
      district: z.string().optional().describe('例如 东城区、朝阳区、全市。省略则返回全部'),
    },
  },
  async ({ district }) => {
    const all = await beijingWeather()
    const data = district ? all[district] || { error: `没有这个区：${district}` } : all
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }
  },
)

const transport = new StdioServerTransport()
await server.connect(transport)
