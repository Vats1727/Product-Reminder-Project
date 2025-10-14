import React from 'react'

export default function TableControls({ 
  searchQuery, 
  onSearchChange, 
  sortBy, 
  sortOrder, 
  onSortChange, 
  sortOptions,
  totalItems,
  currentPage,
  onPageChange
}) {
  const totalPages = Math.ceil(totalItems / 10)
  
  return (
    <div className="table-controls">
      <div className="filters">
        <input
          type="search"
          placeholder="Search..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="search-input"
        />
        
        <select 
          value={sortBy} 
          onChange={e => onSortChange(e.target.value, sortOrder)}
          className="sort-select"
        >
          <option value="">Sort by...</option>
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <select 
          value={sortOrder} 
          onChange={e => onSortChange(sortBy, e.target.value)}
          className="sort-order-select"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
      
      <div className="pagination">
        <button 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1}
          className="pagination-button arrow-theme"
          title="Previous page"
        >
          ←
        </button>

        <span className="pagination-info">
          Page {currentPage} of {totalPages} ({totalItems} items)
        </span>

        <button 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages}
          className="pagination-button arrow-theme"
          title="Next page"
        >
          →
        </button>
      </div>
    </div>
  )
}