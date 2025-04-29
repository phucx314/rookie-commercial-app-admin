import React from 'react';

const CategoryModal = ({
  isOpen,
  title,
  category,
  allCategories,
  onClose,
  onChange,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{title}</h2>
        <input
          type="text"
          placeholder="Category Name"
          value={category.name}
          onChange={(e) => onChange({ ...category, name: e.target.value })}
          id={`${title.toLowerCase()}-category-name`}
          name={`${title.toLowerCase()}-category-name`}
        />
        <textarea
          placeholder="Description"
          value={category.description}
          onChange={(e) => onChange({ ...category, description: e.target.value })}
          id={`${title.toLowerCase()}-category-description`}
          name={`${title.toLowerCase()}-category-description`}
        />
        <select
          value={category.parentId || ''}
          onChange={(e) => onChange({ ...category, parentId: e.target.value })}
          id={`${title.toLowerCase()}-category-parent`}
          name={`${title.toLowerCase()}-category-parent`}
        >
          <option value="">No Parent Category</option>
          {allCategories
            .filter(c => c.id !== category.id)
            .map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </select>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={() => onSubmit(category)}>
            {title === 'Add New' ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal; 