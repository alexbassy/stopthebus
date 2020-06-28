import React, { useState, useContext, SyntheticEvent, ChangeEvent } from 'react'
import GameContext from '../contexts/GameContext'
import EmitterContext from '../contexts/EmitterContext'
import { categories } from '../constants/categories'
import { List, Item, Button, Input, Checkbox } from './visual'
import { Flex } from './layout'

interface CategoriesListProps {
  selectedCategories: string[]
  onChange: (categories: string[]) => void
}

export default function CategoriesList(props: CategoriesListProps) {
  const emit = useContext(EmitterContext)
  const game = useContext(GameContext)
  const { selectedCategories, onChange } = props
  const [customCategory, setCustomCategory] = useState<string>('')
  const customCategories = selectedCategories.filter(
    (cat) => !categories.includes(cat)
  )

  const handleNewCustomCategory = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (customCategory.trim().length < 2) {
      // Should show an error here
      return
    }

    onChange([...new Set([...selectedCategories, customCategory])])
    setCustomCategory('')
  }

  const handleCustomCategoryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCustomCategory(event.target.value)
  }

  if (!game || !emit) {
    return null
  }

  return (
    <div>
      <List columns={[1, 1, 1]} stackOnMobile>
        {[...categories, ...customCategories].map((category, index) => {
          return (
            <Item key={index}>
              <label>
                <Flex yCentre>
                  <Checkbox
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
                </Flex>
              </label>
            </Item>
          )
        })}
      </List>
      <div>
        <form onSubmit={handleNewCustomCategory}>
          <Input
            type='text'
            value={customCategory}
            onChange={handleCustomCategoryChange}
            placeholder='Custom category'
          />{' '}
          <Button>Add</Button>
        </form>
      </div>
    </div>
  )
}
