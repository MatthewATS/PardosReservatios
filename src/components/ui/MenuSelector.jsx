import { useState } from 'react'
import { Plus, Minus, Search } from 'lucide-react'
import { useKitchen } from  '@/context/KitchenContext'
import { Input } from './Input'
import { Button } from './Button'
import styles from './MenuSelector.module.css'

export function MenuSelector({ selectedItems = [], onChange }) {
  const { menuItems } = useKitchen()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')

  const categories = ['Todos', ...new Set(menuItems.map(m => m.category))]

  const filtered = menuItems.filter(m => {
    const matchCat = activeCategory === 'Todos' || m.category === activeCategory
    const matchQuery = m.name.toLowerCase().includes(query.toLowerCase())
    return matchCat && matchQuery
  })

  const addItem = (item) => {
    const existing = selectedItems.find(i => i.id === item.id)
    if (existing) {
      onChange(selectedItems.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
    } else {
      onChange([...selectedItems, { ...item, qty: 1 }])
    }
  }

  const removeItem = (item) => {
    const existing = selectedItems.find(i => i.id === item.id)
    if (existing.qty === 1) {
      onChange(selectedItems.filter(i => i.id !== item.id))
    } else {
      onChange(selectedItems.map(i => i.id === item.id ? { ...i, qty: i.qty - 1 } : i))
    }
  }

  const getQty = (id) => selectedItems.find(i => i.id === id)?.qty || 0

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Input 
          placeholder="Buscar plato..." 
          id="menu-search"
          name="menu-query"
          value={query} 
          onChange={e => setQuery(e.target.value)} 
          icon={<Search size={16} />}
        />
        <div className={styles.categories}>
          {categories.map(c => (
            <button 
              key={c} 
              type="button"
              className={`${styles.catBtn} ${activeCategory === c ? styles.active : ''}`}
              onClick={() => setActiveCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      
      <div className={styles.grid}>
        {filtered.map(item => {
          const qty = getQty(item.id)
          return (
            <div key={item.id} className={`${styles.itemCard} ${qty > 0 ? styles.selected : ''}`}>
              <div className={styles.itemInfo}>
                <h4>{item.name}</h4>
                <p>S/ {item.price.toFixed(2)}</p>
              </div>
              <div className={styles.itemActions}>
                {qty > 0 ? (
                  <div className={styles.qtyControl}>
                    <button type="button" onClick={() => removeItem(item)}><Minus size={14}/></button>
                    <span>{qty}</span>
                    <button type="button" onClick={() => addItem(item)}><Plus size={14}/></button>
                  </div>
                ) : (
                  <button type="button" className={styles.addBtn} onClick={() => addItem(item)}>
                    Añadir
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {selectedItems.length > 0 && (
        <div className={styles.summary}>
          <strong>Total Pedido: S/ {selectedItems.reduce((acc, i) => acc + (i.price * i.qty), 0).toFixed(2)}</strong>
          <span>({selectedItems.reduce((acc, i) => acc + i.qty, 0)} platos)</span>
        </div>
      )}
    </div>
  )
}
