import { useEffect, useState } from 'react';
import { getGuitars } from '../api';
import { GuitarDto, GuitarGetDto } from '../shared';

const guitarToTr = (guitar: GuitarDto) => {
  return <tr key={guitar.id}>
    <td>{guitar.make}</td>
    <td>{guitar.model}</td>
    <td><img style={{
      maxHeight: 200,
    }} src={guitar.imageUrl} /></td>
  </tr>
}

const guitarTable = (items: GuitarDto[]) => {
  return <table id="guitars-table" >
    <tbody>
      {items.map(x => guitarToTr(x))}
    </tbody>
  </table>
}

const Guitars = () => {
  const [guitarsOrNull, setGuitars] = useState<GuitarGetDto | null>(null);

  useEffect(async () => {
    const guitarsFromApi = await getGuitars()
    setGuitars(guitarsFromApi)
  }, [])

  return guitarsOrNull ? guitarTable(guitarsOrNull.items) : <span>Loading...</span>
}

export default Guitars