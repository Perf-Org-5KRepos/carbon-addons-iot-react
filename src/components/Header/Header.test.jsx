import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Notification from '@carbon/icons-react/lib/notification/20';
import Avatar from '@carbon/icons-react/lib/user--avatar/20';
import HeaderHelp from '@carbon/icons-react/lib/help/20';

import Header from './Header';

React.Fragment = ({ children }) => children;

describe('Header testcases', () => {
  const onClick = jest.fn();
  const actionItems = [
    {
      label: 'alerts',
      onClick,
      btnContent: <Notification fill="white" description="Icon" />,
    },
    {
      label: 'help',
      headerPanel: true,
      btnContent: (
        <HeaderHelp
          fill="white"
          description="Icon"
          className="bx--header__menu-item bx--header__menu-title"
        />
      ),
      childContent: [
        {
          onCLick: () => console.log('hi'),
          content: <p>This is a link</p>,
        },
        {
          onCLick: () => console.log('hi'),
          content: (
            <React.Fragment>
              <span>
                JohnDoe@ibm.com
                <Avatar fill="white" description="Icon" />
              </span>
            </React.Fragment>
          ),
        },
      ],
    },
    {
      label: 'other help',
      onClick,
      btnContent: (
        <HeaderHelp
          fill="white"
          description="Icon"
          className="bx--header__menu-item bx--header__menu-title"
        />
      ),
      childContent: [
        {
          onCLick: () => console.log('hi'),
          content: (
            <React.Fragment>
              <span>
                JohnDoe@ibm.com
                <Avatar fill="white" description="Icon" />
              </span>
            </React.Fragment>
          ),
        },
      ],
    },
  ];
  it('should render', () => {
    const { container } = render(
      <Header
        title="My Title"
        user="j@test.com"
        tenant="acme"
        appName="platform"
        actionItems={actionItems}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('action btn should open side panel', () => {
    const { container, getByTitle, getByText } = render(
      <Header
        title="My Title"
        user="j@test.com"
        tenant="acme"
        appName="platform"
        actionItems={actionItems}
      />
    );
    // fireEvent.click(getByTitle('help'));
    // fireEvent.focus(getByText('This is a link'));
    expect(getByText('This is a link')).toBeTruthy();
    // fireEvent.blur(container.querySelector('.action-btn__group'));
  });
});
