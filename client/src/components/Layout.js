import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Drawer, List, ListItem, ListItemText, ListItemIcon, IconButton, Divider, Avatar, Menu, MenuItem } from '@mui/material';
import { AccountBalance, Dashboard, AccountBalanceWallet, Receipt, Send, Person, Security, AdminPanelSettings, Menu as MenuIcon, ExitToApp } from '@mui/icons-material';

const drawerWidth = 240;

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const menuItems = [
    { text: 'Home', icon: <AccountBalance />, path: '/' },
  ];

  const authMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Accounts', icon: <AccountBalanceWallet />, path: '/accounts' },
    { text: 'Transactions', icon: <Receipt />, path: '/transactions' },
    { text: 'Transfer', icon: <Send />, path: '/transfer' },
    { text: 'Security', icon: <Security />, path: '/security' },
    { text: 'Profile', icon: <Person />, path: '/profile' },
  ];

  const allMenuItems = token ? [...menuItems, ...authMenuItems] : menuItems;
  
  if (token && (user.role === 'admin' || user.role === 'super_admin')) {
    allMenuItems.push({ text: 'Admin', icon: <AdminPanelSettings />, path: '/admin' });
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/');
    handleMenuClose();
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" color="primary" fontWeight="bold">
          AWB
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {allMenuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      {token && (
        <>
          <Divider />
          <List>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon><ExitToApp /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: '#1a237e'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Amenires World Bank
          </Typography>
          {token ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {user.firstName} {user.lastName}
              </Typography>
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                sx={{ ml: 0 }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#ffd700' }}>
                  {user.firstName?.[0]?.toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem component={Link} to="/profile" onClick={handleMenuClose}>
                  Profile
                </MenuItem>
                <MenuItem component={Link} to="/security" onClick={handleMenuClose}>
                  Security
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ExitToApp sx={{ mr: 1 }} /> Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" component={Link} to="/login">
                Sign In
              </Button>
              <Button
                variant="contained"
                sx={{ bgcolor: '#ffd700', color: '#000' }}
                component={Link}
                to="/register"
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;
