import React, { ChangeEvent, SyntheticEvent, useContext, useState } from 'react'
import { Flex } from './layout'
import { Button, Checkbox, Input, Item, List, HiddenLabel } from './visual'
import { categories } from '../constants/game'
import EmitterContext from '../contexts/EmitterContext'
import GameContext from '../contexts/GameContext'

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
          const id = category.replace(/\s/g, '').toLowerCase()
          return (
            <Item key={index}>
              <label htmlFor={id}>
                <Flex yCentre>
                  <Checkbox
                    id={id}
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
          <HiddenLabel htmlFor='game-custom-category'>
            Custom category
          </HiddenLabel>
          <Input
            id='game-custom-category'
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
