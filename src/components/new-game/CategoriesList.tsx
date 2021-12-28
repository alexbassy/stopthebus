import React, { ChangeEvent, SyntheticEvent, useContext, useState } from 'react'
import { categories as defaultCategories } from '@/constants/game'
import { Flex } from '@/components/Grid'
import { Button, Checkbox, Input, Item, List, HiddenLabel, H3, Lighter } from '@/components/visual'
import { manager, useGameConfigCategories } from '@/hooks/supabase'

function sortByDefaultOrder(array: string[]) {
  return array.sort((a, b) => defaultCategories.indexOf(a) - defaultCategories.indexOf(b))
}

const CategoriesList: React.FC = () => {
  const [customCategory, setCustomCategory] = useState('')
  const selectedCategories = useGameConfigCategories()
  const customCategories = selectedCategories.filter((cat) => !defaultCategories.includes(cat))

  const toggleCategory = (category: string) => {
    const newState = new Set(selectedCategories)
    newState.has(category) ? newState.delete(category) : newState.add(category)
    manager.setGameConfigCategories(sortByDefaultOrder(Array.from(newState)))
  }

  const handleNewCustomCategory = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const deduplicated = Array.from(new Set([...selectedCategories, customCategory]))
    manager.setGameConfigCategories(sortByDefaultOrder(deduplicated))
    setCustomCategory('')
  }

  const handleCustomCategoryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCustomCategory(event.target.value)
  }

  return (
    <section>
      <H3>
        Categories
        <Lighter> ({selectedCategories?.length ?? 0} selected)</Lighter>
      </H3>

      <List columns={[1, 1, 1]} stackOnMobile>
        {[...defaultCategories, ...customCategories].map((category, index) => {
          const id = category.replace(/\s/g, '').toLowerCase()
          return (
            <Item key={index}>
              <label htmlFor={id}>
                <Flex yCentre>
                  <Checkbox
                    id={id}
                    type='checkbox'
                    onChange={() => toggleCategory(category)}
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
          <HiddenLabel htmlFor='game-custom-category'>Custom category</HiddenLabel>
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
    </section>
  )
}

export default CategoriesList
