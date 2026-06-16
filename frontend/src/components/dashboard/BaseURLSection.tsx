import CustomSelect from '../ui/CustomSelect'

interface Props {
  serverURL: string
  updating: boolean
  onChange: (serverURL: string) => void
}

const serverOptions = [
  { label: '国际节点 · https://ai.allrealai.com', value: 'https://ai.allrealai.com' },
  { label: '中国节点 · https://cn.allrealai.com', value: 'https://cn.allrealai.com' },
]

export default function BaseURLSection({ serverURL, updating, onChange }: Props) {
  return (
    <section className="section-block">
      <div className="mb-3">
        <h2 className="section-title">中转站地址</h2>
      </div>
      <div className="max-w-xl">
        <CustomSelect
          value={serverURL || serverOptions[0].value}
          options={serverOptions}
          disabled={updating}
          onChange={onChange}
        />
      </div>
    </section>
  )
}
