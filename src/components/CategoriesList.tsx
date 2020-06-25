import React from 'react'
import { categories } from '../constants/categories'

interface CategoriesListProps {
  selectedCategories: string[]
  onChange: (categories: string[]) => void
}

export default function CategoriesList(props: CategoriesListProps) {
  const { selectedCategories, onChange } = props
  return (
    <div>
      <ul>
        {categories.map((category, index) => {
          return (
            <li key={index}>
              <label>
                <input
                  type='checkbox'
                  onChange={() => {
                    const newState = new Set(selectedCategories)
                    newState.has(category)
                      ? newState.delete(category)
                      : newState.add(category)
                    onChange(Array.from(newState))
                  }}
                  checked={selectedCategories.includes(category)}
                />
                <span>{category}</span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
