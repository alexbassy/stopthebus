import React, { ChangeEvent, SyntheticEvent, useState } from 'react'
import { categories as defaultCategories } from '@/constants/game'
import { HiddenLabel, H3, Lighter } from '@/components/visual'
import { manager, useGameConfigCategories } from '@/hooks/database'
import useSound from 'use-sound'
import { Button, FormElement, Grid, Input, Checkbox, Spacer, Text } from '@nextui-org/react'

function sortByDefaultOrder(array: string[]) {
  return array.sort((a, b) => defaultCategories.indexOf(a) - defaultCategories.indexOf(b))
}

const CategoriesList: React.FC = () => {
  const [customCategory, setCustomCategory] = useState('')
  const selectedCategories = useGameConfigCategories()
  const customCategories = selectedCategories.filter((cat) => !defaultCategories.includes(cat))
  const [playCheck] = useSound('/sounds/tap.mp3', { volume: 0.1 })

  const toggleCategory = (category: string) => {
    playCheck()
    manager.toggleCategory(category)
  }

  const handleNewCustomCategory = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    manager.toggleCategory(customCategory)
    setCustomCategory('')
  }

  const handleCustomCategoryChange = (event: ChangeEvent<FormElement>) => {
    setCustomCategory(event.target.value)
  }

  return (
    <section>
      <Text h3>
        Categories
        <Lighter> ({selectedCategories?.length ?? 0} selected)</Lighter>
      </Text>

      <Grid.Container>
        {[...defaultCategories, ...customCategories].map((category, index) => {
          const id = category.replace(/\s/g, '').toLowerCase()
          return (
            <Grid key={index} xs={12} md={4}>
              <Checkbox
                id={id}
                onChange={() => toggleCategory(category)}
                checked={selectedCategories.includes(category)}
              >
                {category}
              </Checkbox>
            </Grid>
          )
        })}
      </Grid.Container>
      <Spacer y={1} />
      <form onSubmit={handleNewCustomCategory}>
        <Grid.Container>
          <Grid>
            <HiddenLabel htmlFor='game-custom-category'>Custom category</HiddenLabel>
            <Input
              id='game-custom-category'
              type='text'
              value={customCategory}
              onChange={handleCustomCategoryChange}
              placeholder='Custom category'
            />{' '}
          </Grid>
          <Grid>
            <Button shadow color='primary' auto>
              Add
            </Button>
          </Grid>
        </Grid.Container>
      </form>
    </section>
  )
}

export default CategoriesList
