
import React, { useState, useEffect, useRef } from "react";
import { hot } from 'react-hot-loader/root';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'
import { GunContinuousSequence } from 'crdt-continuous-sequence'

const Gun = require('gun/gun');
require('gun/lib/open')

const getId = (element) => element['_']['#']

const updateCollection = (update, cs) => (element) => {
  const id = getId(element);
  update(collection => {
    const newCollection = [...collection]
    let index
    if ((index = newCollection.findIndex(e => getId(e) === id)) > -1) {
      newCollection[index] = { ...newCollection[index], ...element }
    } else {
      newCollection.push(element)
    }
    cs.sort(newCollection);
    return newCollection
  })
}

const updateSubCollection = (update, cs, rootId) => (element, key) =>
  update(collection => {
    const newCollection = { ...collection };
    const id = element ? getId(element) : key;
    const root = [...newCollection[rootId] || []]
    let elementIndex
    if ((elementIndex = root.findIndex(e => getId(e) === id)) > -1) {
      if (element) {
        root[elementIndex] = { ...root[elementIndex], ...element }
      } else {
        root.splice(elementIndex, 1)
      }
    } else if (element) {
      root.push(element)
      cs.sort(root)
    }
    newCollection[rootId] = root
    return newCollection
  })


const reorder = (collection, source, destination, updateCollection, cs, draggableId) => {
  const newCollection = [...collection];
  const [current] = newCollection.splice(source.index, 1);
  const prev = newCollection[destination.index - 1];
  const next = newCollection[destination.index];
  newCollection.splice(destination.index, 0, current);
  updateCollection(newCollection);
  cs.move(draggableId, prev, next);
}

const App = () => {
  const boardId = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const board = urlParams.get('board');

  if (!board) {
    return <div className="new-board"><form onSubmit={e => {
      e.preventDefault();
      if (boardId.current.value) {
        window.location.href = `${window.location.origin}?board=${boardId.current.value}`
      }
    }}><input ref={boardId} placeholder="(New) board ID e.g. nickstodos" /></form></div>
  }
  return <Board boardId={board} />
}
const Board = ({ boardId }) => {
  const [gun, setGun] = useState(null)
  const [cs, setCs] = useState(null)
  const [editing, setEditing] = useState(false)
  const [board, setBoard] = useState({})
  const [lanes, setLanes] = useState([])
  const [laneCards, setLaneCards] = useState({})
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const newLaneTitle = useRef(null)

  useEffect(() => {
    const gun = Gun({
      peers: ['https://gunjs.herokuapp.com/gun']
    })
    const cs = new GunContinuousSequence(gun)
    setGun(gun)
    setCs(cs)
  }, [])

  useEffect(() => {
    if (gun) {
      gun.get(boardId).on(board => setBoard(b => ({ ...b, ...board }))).get('lanes').map().on(updateCollection(setLanes, cs))
    }
  }, [gun])

  if (!gun || !cs) {
    return <div>Loading...</div>
  }

  return <DragDropContext onDragEnd={({ source, destination, type, draggableId }) => {
    if (!destination || (source.droppableId && source.index) === (destination.droppableId === destination.index)) {
      return;
    }

    switch (type) {
      case 'LANE':
        reorder(lanes, source, destination, setLanes, cs, draggableId);
        break;
      case 'CARD':
        if (source.droppableId === destination.droppableId) {
          reorder(laneCards[source.droppableId], source, destination, (newLaneCards) => setLaneCards({
            ...laneCards,
            [source.droppableId]: newLaneCards
          }), cs, draggableId)
        } else {
          const newSourceCollection = [...laneCards[source.droppableId]]
          const [current] = newSourceCollection.splice(source.index, 1);

          const newDestinationCollection = [...laneCards[destination.droppableId] || []]
          const prev = newDestinationCollection[destination.index - 1];
          const next = newDestinationCollection[destination.index];
          newDestinationCollection.splice(destination.index, 0, current);
          setLaneCards({
            ...laneCards,
            [source.droppableId]: newSourceCollection,
            [destination.droppableId]: newDestinationCollection,
          })

          gun.get(source.droppableId).get('cards').get(draggableId).put(null);
          gun.get(destination.droppableId).get('cards').set(current)
          cs.move(draggableId, prev, next)
        }

        break;
    }
  }}>
    <div className="board">
      {editing ? <form onSubmit={e => {
        e.preventDefault();
        gun.get(boardId).get('title').put(newBoardTitle)
        setEditing(false)
      }}>
        <input value={newBoardTitle} onChange={e => setNewBoardTitle(e.target.value)} placeholder="board title" />
      </form>
        : <h1 onDoubleClick={e => {
          setNewBoardTitle(board.title)
          setEditing(true)
        }} className="board-title">{board && board.title || boardId}</h1>}
      <div className="board-content">
        <Droppable droppableId="board" type="LANE" direction="horizontal">
          {(provided, snapshot) => <div ref={provided.innerRef} className="lanes" {...provided.droppableProps}>
            {lanes.map((lane, i) => {
              const id = getId(lane)
              return <Lane
                key={id}
                index={i}
                lane={lane}
                cards={laneCards[id]}
                gun={gun}
                cs={cs}
                onCard={updateSubCollection(setLaneCards, cs, id)} />
            })}
            {provided.placeholder}
          </div>}
        </Droppable>
        <div className="new-lane">
          <form onSubmit={e => {
            e.preventDefault();
            gun.get(boardId).get('lanes').set({
              title: newLaneTitle.current.value
            })
            newLaneTitle.current.value = ''
          }}>
            <input ref={newLaneTitle} placeholder="new lane" />
          </form>
        </div>
      </div>
    </div>
  </DragDropContext>
}

const Lane = ({ lane, cards, index, gun, cs, onCard }) => {
  const id = getId(lane);
  const [editing, setEditing] = useState()
  const [laneTitle, setLaneTitle] = useState(lane.title)
  const newCardTitle = useRef(null)
  useEffect(() => {
    if (gun && cs) {
      gun.get(id).get('cards').map().on(onCard)
    }
  }, [gun, cs])

  return <Draggable
    draggableId={id}
    index={index}>{(provided, snapshot) => <div
      ref={provided.innerRef}
      className="lane"
      {...provided.draggableProps}
      {...provided.dragHandleProps}>
      {editing ? <form onSubmit={e => {
        e.preventDefault();
        gun.get(id).get('title').put(laneTitle)
        setEditing(false)
      }}>
        <input autoFocus value={laneTitle} onChange={e => setLaneTitle(e.target.value)} placeholder="lane title" />
      </form> : <div onDoubleClick={e => { setLaneTitle(lane.title); setEditing(true) }} className="lane-title">{lane.title || 'No title'}</div>}
      <Droppable droppableId={id} type="CARD">
        {(provided, snapshot) => <div ref={provided.innerRef} className="cards" {...provided.droppableProps}>
          {(cards || []).map((card, i) => <Card key={getId(card)} index={i} card={card} gun={gun} />)}
          {provided.placeholder}
        </div>}
      </Droppable>
      <div className="new-card">
        <form onSubmit={e => {
          e.preventDefault();
          gun.get(id).get('cards').set({
            title: newCardTitle.current.value
          })
          newCardTitle.current.value = ''
        }}>
          <input ref={newCardTitle} placeholder="new card" />
        </form>
      </div>
    </div>}
  </Draggable>
}

const Card = ({ laneId, index, card, gun }) => {
  const id = getId(card)
  const [editing, setEditing] = useState()
  const [cardTitle, setCardTitle] = useState(card.title)
  return <Draggable
    draggableId={id}
    index={index}>{(provided, snapshot) =>
      <div
        ref={provided.innerRef}
        className="card"
        {...provided.draggableProps}
        {...provided.dragHandleProps}>
        {editing ? <form onSubmit={e => {
          e.preventDefault();
          gun.get(id).get('title').put(cardTitle)
          setEditing(false)
        }}>
          <input autoFocus value={cardTitle} onChange={e => setCardTitle(e.target.value)} placeholder="card title" />
        </form> : <div onDoubleClick={e => {
          setCardTitle(card.title)
          setEditing(true)
        }} className="card-title">{card.title || 'No title'}{' '}
            <a href={`/?board=${id}`} target="_blank" className="card-link">#</a></div>}
      </div>
    }</Draggable>
}


export default hot(App);

