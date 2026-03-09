'use client'

import { useState } from 'react'
import { type Person } from '@/lib/types'
import AddPersonForm from './AddPersonForm'
import PersonCard from './PersonCard'

interface Props {
  initialPeople: Person[]
}

export default function PeopleList({ initialPeople }: Props) {
  const [people, setPeople] = useState<Person[]>(initialPeople)

  function handleAdd(person: Person) {
    setPeople(prev => [...prev, person].sort((a, b) => a.name.localeCompare(b.name)))
  }

  function handleDelete(id: string) {
    setPeople(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-4">
      <AddPersonForm onAdd={handleAdd} />

      {people.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm" style={{ color: 'var(--n-text3)' }}>
            No people added yet. Add someone above to start building context.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {people.map(person => (
            <PersonCard key={person.id} person={person} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
