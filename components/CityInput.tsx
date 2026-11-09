// A plain text box with suggestions for common Indian starting cities. Any city can be typed.
export const CITIES = [
  'Ranchi', 'Patna', 'Kolkata', 'Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Ahmedabad',
  'Jaipur', 'Lucknow', 'Bhubaneswar', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Gaya', 'Varanasi', 'Prayagraj', 'Kanpur',
  'Guwahati', 'Siliguri', 'Raipur', 'Bhopal', 'Indore', 'Nagpur', 'Chandigarh', 'Dehradun', 'Surat', 'Kochi',
  'Visakhapatnam', 'Coimbatore', 'Durgapur', 'Asansol', 'Muzaffarpur', 'Bhagalpur', 'Hazaribagh', 'Deoghar', 'Rourkela', 'Noida', 'Gurugram',
]

type Props = { id: string; name?: string; value?: string; onChange?: (v: string) => void; placeholder?: string; required?: boolean; className?: string }

export function CityInput({ id, name, value, onChange, placeholder, required, className = 'inp' }: Props) {
  return (
    <>
      <input id={id} name={name} className={className} list={`${id}-cities`} autoComplete="address-level2" maxLength={60}
        placeholder={placeholder ?? 'Type your city'} required={required}
        {...(onChange ? { value: value ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) } : {})} />
      <datalist id={`${id}-cities`}>{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
    </>
  )
}
